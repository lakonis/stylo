import { DocumentNode } from 'substance'

class ArticleNode extends DocumentNode {}

ArticleNode.type = 'article'

/*
  Attributes
    article-type Type of Article
    dtd-version Version of the Tag Set (DTD)
    id Document Internal Identifier
    specific-use Specific Use
    xml:base Base
    xml:lang Language
    xmlns:ali NISO ALI Namespace (NISO Access License and Indicators)
    xmlns:mml MathML Namespace Declaration
    xmlns:xlink XLink Namespace Declaration
    xmlns:xsi XML Schema Namespace Declaration

  Content Model
    (front, body?, back?, floats-group?, (sub-article* | response*))
*/

ArticleNode.define({
  attributes: { type: 'object', default: {} },
  front: { type: 'id' },
  body: { type: 'id', optional: true },
  back: { type: 'id', optional: true },
  floatsGroup: { type: 'id', optional: true },
  subArticles: { type: ['id'], optional: true },
  responses: { type: ['id'], optional: true }
})

export default ArticleNode
