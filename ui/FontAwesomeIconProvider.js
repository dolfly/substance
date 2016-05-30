'use strict';

var clone = require('lodash/clone');
var forEach = require('lodash/forEach');
var oo = require('../util/oo');
var Icon = require('./FontAwesomeIcon');

// TODO: we should create a 'core' package where we configure those
var ICON_MAP = {
  'save': 'fa-save',
  'undo': 'fa-undo',
  'redo': 'fa-repeat',
  // Annotation modes
  'edit': 'fa-cog',
  'expand': 'fa-arrows-h',
  'truncate': 'fa-arrows-h'
};

function FontAwesomeIconProvider(icons) {
  this.map = clone(ICON_MAP);
  forEach(icons, function(config, name) {
    var faClass = config['fontawesome'];
    if (faClass) {
      this.addIcon(name, faClass);
    }
  }.bind(this));
}

FontAwesomeIconProvider.Prototype = function() {

  this.renderIcon = function($$, name) {
    var iconClass = this.map[name];
    if (iconClass) {
      return $$(Icon, {icon:iconClass});
    }
  };

  this.addIcon = function(name, faClass) {
    this.map[name] = faClass;
  };
};

oo.initClass(FontAwesomeIconProvider);

module.exports = FontAwesomeIconProvider;