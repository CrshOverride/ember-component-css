/* jshint node: true */
'use strict';
var Funnel = require('broccoli-funnel');
var Concat = require('broccoli-concat');
var Merge = require('broccoli-merge-trees');
var ProcessStyles = require('./lib/pod-style.js');
var ExtractNames = require('./lib/pod-names.js');
var IncludeAll = require('./lib/include-all.js');

module.exports = {

  _getPodStyleFunnel: function() {
    return new Funnel(this.projectRoot, {
      srcDir: this._podDirectory(),
      exclude: ['styles/**/*'],
      include: ['**/*.{' + this.allowedStyleExtensions + '}'],
      allowEmpty: true,
      annotation: 'Funnel (ember-component-css grab files)'
    });
  },

  _podDirectory: function() {
    return this.appConfig.podModulePrefix ? this.appConfig.podModulePrefix.replace(this.appConfig.modulePrefix, '') : '';
  },

  _namespacingIsEnabled: function() {
    return this.addonConfig.namespacing !== false;
  },

  included: function(app) {
    if (app.app) { app = app.app; }

    this._super.included.apply(this, arguments);

    this.projectRoot = app.trees.app;
    this.appConfig = app.project.config(app.env);
    this.addonConfig = this.appConfig['ember-component-css'] || {};
    this.allowedStyleExtensions = app.registry.extensionsForType('css').filter(Boolean);
  },

  treeForAddon: function(tree) {
    if (this._namespacingIsEnabled()) {
      var podStyles = this._getPodStyleFunnel();
      var podNames = new ExtractNames(podStyles, {
        annotation: 'Walk (ember-component-css extract class names from style paths)'
      });

      tree = new Merge([tree, podNames], {
        overwrite: true,
        annotation: 'Merge (ember-component-css merge names with addon tree)'
      });
    }

    return this._super.treeForAddon.call(this, tree);
  },

  treeForStyles: function(tree) {
    var podStyles = this._getPodStyleFunnel();

    if (this._namespacingIsEnabled()) {
      podStyles = new ProcessStyles(podStyles, {
        extensions: this.allowedStyleExtensions,
        annotation: 'Filter (ember-component-css process :--component with class names)'
      });
    }

    var styleManifest = new IncludeAll(podStyles, {
      annotation: 'IncludeAll (ember-component-css combining all style files that there are extensions for)'
    });

    podStyles = new Merge([podStyles, styleManifest, tree].filter(Boolean), {
      annotation: 'Merge (ember-component-css merge namespacedStyles with style manafest)'
    });

    return this._super.treeForStyles.call(this, podStyles);
  },

  name: 'ember-component-css'
};
