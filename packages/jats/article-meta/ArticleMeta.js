import { DocumentNode } from 'substance'

class ArticleMeta extends DocumentNode {}

ArticleMeta.type = 'article-meta'

ArticleMeta.define({
  attributes: { type: 'object', default: {} },
  nodes: { type: ['id'], default: [] }
})

export default ArticleMeta
