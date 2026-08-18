interface Env {
  R1: R2Bucket
  KV: KVNamespace
  GITHUB_REPO: string
  KEEP_RELEASES_COUNT: string
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { env } = context
  const [owner, repo] = env.GITHUB_REPO.split('/')
  const keepCount = parseInt(env.KEEP_RELEASES_COUNT || '3', 10)

  const ghRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/releases?per_page=100`,
    {
      headers: {
        'User-Agent': 'dev-sidemirror',
        'Accept': 'application/vnd.github+json',
      },
    }
  )

  if (!ghRes.ok) {
    return Response.json({ error: 'GitHub API error' }, { status: 502 })
  }

  const ghData = await ghRes.json() as any

  const stableReleases = ghData
    .filter((r: any) => !r.prerelease && !r.draft)
    .map((r: any) => r.tag_name)

  const versionsToDelete = stableReleases.slice(keepCount)

  let deleted = 0
  for (const version of versionsToDelete) {
    const prefix = `${version}/`
    const listed = await env.R1.list({ prefix })
    for (const obj of listed.objects) {
      await env.R1.delete(obj.key)
      await env.KV.delete(`count:${obj.key}`)
      deleted++
    }
  }

  return Response.json({ deleted, versionsDeleted: versionsToDelete })
}
