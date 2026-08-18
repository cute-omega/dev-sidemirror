interface Env {
  R2: R2Bucket
  KV: KVNamespace
  GITHUB_REPO: string
  R2_MAX_CAPACITY: string
  KEEP_RELEASES_COUNT: string
}

function r1Key(version: string, filename: string): string {
  return `${version}/${filename}`
}

async function getDownloadUrl(env: Env, version: string, filename: string): Promise<string | null> {
  const [owner, repo] = env.GITHUB_REPO.split('/')
  const ghRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/releases/tags/${version}`,
    {
      headers: {
        'User-Agent': 'dev-sidemirror',
        Accept: 'application/vnd.github+json',
      },
    },
  )

  if (!ghRes.ok) return null
  const release = (await ghRes.json()) as any
  const asset = (release.assets || []).find((a: any) => a.name === filename)
  return asset?.browser_download_url || null
}

async function getR2Usage(env: Env): Promise<number> {
  let used = 0
  const listed = await env.R2.list()
  for (const obj of listed.objects) {
    used += obj.size
  }
  return used
}

async function findLeastUsedFile(env: Env): Promise<string | null> {
  const listed = await env.R2.list()
  if (listed.objects.length === 0) return null

  let minCount = Infinity
  let minKey = ''

  for (const obj of listed.objects) {
    const countKey = `count:${obj.key}`
    const countStr = await env.KV.get(countKey)
    const count = countStr ? parseInt(countStr, 10) : 0
    if (count < minCount) {
      minCount = count
      minKey = obj.key
    }
  }

  return minKey
}

async function tryCacheToR2(env: Env, key: string, body: ArrayBuffer, contentType: string) {
  const maxCapacity = parseInt(env.R2_MAX_CAPACITY || '10737418240', 10)
  const currentUsage = await getR2Usage(env)

  if (currentUsage + body.byteLength > maxCapacity) {
    const victimKey = await findLeastUsedFile(env)
    if (victimKey && victimKey !== key) {
      await env.R2.delete(victimKey)
      const countKey = `count:${victimKey}`
      await env.KV.delete(countKey)
    } else {
      return
    }
  }

  await env.R2.put(key, body, {
    httpMetadata: { contentType },
  })
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { env, params, waitUntil } = context
  const version = (params.version as string[]).join('/')
  const filename = (params.version as string[]).pop() || ''
  const key = r1Key(version, filename)

  const r1Obj = await env.R2.get(key)
  if (r1Obj) {
    const countKey = `count:${key}`
    const current = await env.KV.get(countKey)
    const newCount = (current ? parseInt(current, 10) : 0) + 1
    waitUntil(env.KV.put(countKey, String(newCount), { expirationTtl: 86400 }))

    return new Response(r1Obj.body, {
      headers: {
        'Content-Type': r1Obj.httpMetadata.contentType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Cache': 'HIT',
      },
    })
  }

  const downloadUrl = await getDownloadUrl(env, version, filename)
  if (!downloadUrl) {
    return Response.json({ error: 'File not found' }, { status: 404 })
  }

  const ghRes = await fetch(downloadUrl, {
    headers: {
      'User-Agent': 'dev-sidemirror',
      Accept: 'application/octet-stream',
    },
  })

  if (!ghRes.ok) {
    return Response.json({ error: 'GitHub download failed' }, { status: 502 })
  }

  const contentType = ghRes.headers.get('Content-Type') || 'application/octet-stream'
  const contentLength = ghRes.headers.get('Content-Length') || '0'

  const responseBody = ghRes.body

  const [clientStream, cacheStream] = responseBody!.tee()

  waitUntil(
    (async () => {
      const chunks: ArrayBuffer[] = []
      const reader = cacheStream.getReader()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value)
      }
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.byteLength, 0)
      const combined = new Uint8Array(totalLength)
      let offset = 0
      for (const chunk of chunks) {
        combined.set(new Uint8Array(chunk), offset)
        offset += chunk.byteLength
      }
      await tryCacheToR2(env, key, combined.buffer, contentType)
      const countKey = `count:${key}`
      await env.KV.put(countKey, '1', { expirationTtl: 86400 })
    })(),
  )

  return new Response(clientStream, {
    headers: {
      'Content-Type': contentType,
      'Content-Length': contentLength,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'X-Cache': 'MISS',
    },
  })
}
