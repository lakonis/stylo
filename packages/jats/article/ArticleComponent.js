import { Component } from 'substance'
import renderNodeComponent from '../../../util/renderNodeComponent'

function ArticleComponent() {
  Component.apply(this, arguments);
}

ArticleComponent.Prototype = function() {

  this.render = function($$) {
    var node = this.props.node;
    var doc = node.getDocument();
    var configurator = this.props.configurator;
    var el = $$('div')
      .addClass('sc-article')
      .attr('data-id', this.props.node.id);

    // Render front
    var front = doc.get('front');
    if (front) {
      var frontEl = renderNodeComponent(this, $$, front, {
        disabled: this.props.disabled,
        configurator: configurator
      });
      el.append(frontEl);
    }

    // Render body
    var body = doc.get(this.props.bodyId);
    if (body) {
      var bodyEl = renderNodeComponent(this, $$, body, {
        disabled: this.props.disabled,
        configurator: configurator
      });
      el.append(bodyEl);
    }

    // Render back matter
    var back = doc.get('back');
    if (back) {
      var backEl = renderNodeComponent(this, $$, back, {
        disabled: this.props.disabled,
        configurator: configurator
      });
      el.append(backEl);
    }

    return el;
  };
};

Component.extend(ArticleComponent);

export default ArticleComponent;