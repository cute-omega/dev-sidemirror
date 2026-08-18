interface Env {
  KV: KVNamespace
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { env } = context

  const list = await env.KV.list({ prefix: 'count:' })
  const stats: Record<string, number> = {}

  for (const key of list.keys) {
    const count = await env.KV.get(key.name)
    if (count) {
      stats[key.name.replace('count:', '')] = parseInt(count, 10)
    }
  }

  return Response.json({ stats })
}
