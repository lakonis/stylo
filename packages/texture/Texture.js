import { Component, DocumentSession } from 'substance'

/*
  Texture Component

  Based on given mode prop, displays the Publisher, Author or Reader component
*/
class Texture extends Component {

  constructor(parent, props) {
    super(parent, props)

    if (!props.configurator) {
      throw new Error("'configurator' is required")
    }
    this.configurator = props.configurator
    this.xmlStore = this.configurator.getXMLStore()
  }

  getChildContext() {
    return {
      xmlStore: this.xmlStore
    }
  }

  getInitialState() {
    return {
      documentSession: null,
      error: null
    }
  }

  didMount() {
    // load the document after mounting
    this._loadDocument(this.props.documentId)
  }

  willReceiveProps(newProps) {
    if (newProps.documentId !== this.props.documentId) {
      this.dispose()
      this.state = this.getInitialState()
      this._loadDocument(newProps.documentId)
    }
  }

  dispose() {
    // Note: we need to clear everything, as the childContext
    // changes which is immutable
    this.empty()
  }

  render($$) {
    let el = $$('div').addClass('sc-texture')

    if (this.state.error) {
      el.append(this.state.error)
    }

    if (this.state.documentSession) {
      let ComponentClass = this.configurator.getInterfaceComponentClass()

      el.append($$(ComponentClass, {
        documentId: this.props.documentId,
        documentSession: this.state.documentSession,
        configurator: this.getConfigurator()
      }))
    }
    return el
  }

  getConfigurator() {
    return this.configurator
  }

  createDocumentSession(doc) {
    return new DocumentSession(doc)
  }

  _loadDocument() {
    const configurator = this.getConfigurator()
    this.xmlStore.readXML(this.props.documentId, function(err, xml) {
      if (err) {
        console.error(err)
        this.setState({
          error: new Error('Loading failed')
        })
        return
      }
      let importer = configurator.createImporter('jats')
      let doc = importer.importDocument(xml)

      // HACK: For debug purposes
      window.doc = doc
      this.setState({
        documentSession: this.createDocumentSession(doc)
      })
    }.bind(this))
  }
}

export default Texture
