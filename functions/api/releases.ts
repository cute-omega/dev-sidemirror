interface Env {
  KV: KVNamespace
  GITHUB_REPO: string
}

const RELEASES_TTL = 300 // 5 minutes

export const onRequest: PagesFunction<Env> = async (context) => {
  const { env, waitUntil } = context
  const [owner, repo] = env.GITHUB_REPO.split('/')

  const cacheKey = `releases:${owner}:${repo}`
  const cached = await env.KV.get(cacheKey, 'json')
  if (cached) {
    return Response.json({ releases: cached })
  }

  const ghRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases?per_page=100`, {
    headers: {
      'User-Agent': 'dev-sidemirror',
      Accept: 'application/vnd.github+json',
    },
  })

  if (!ghRes.ok) {
    return Response.json({ error: 'GitHub API error', status: ghRes.status }, { status: 502 })
  }

  const ghData = (await ghRes.json()) as any

  const releases = ghData
    .filter((r: any) => !r.draft)
    .map((r: any) => ({
      tagName: r.tag_name,
      name: r.name || r.tag_name,
      publishedAt: r.published_at,
      isPrerelease: r.prerelease,
      releaseAssets: (r.assets || []).map((a: any) => ({
        name: a.name,
        size: a.size,
        downloadCount: a.download_count,
        url: a.browser_download_url,
      })),
    }))

  waitUntil(env.KV.put(cacheKey, JSON.stringify(releases), { expirationTtl: RELEASES_TTL }))

  return Response.json({ releases })
}
