/*global _,$,define,App*/
define([
    'backbone',
    'mustache',
    'common-objects/collections/baselines',
    'collections/configuration_items',
    'models/configuration_item',
    'text!templates/baselines/baselines_content.html',
    'views/baselines/baselines_list',
    'views/baselines/baseline_duplicate_view',
    'text!common-objects/templates/buttons/delete_button.html',
    'text!common-objects/templates/buttons/duplicate_button.html',
    'text!common-objects/templates/buttons/snap_button.html',
    'common-objects/views/alert',
    'views/baselines/baseline_creation_view'
], function (Backbone, Mustache, BaselinesCollection, ConfigurationItemCollection,ConfigurationItem, template, BaselinesListView, BaselineDuplicateView, deleteButton, duplicateButton, snapButton, AlertView, BaselineCreationView) {
	'use strict';

    var BaselinesContentView = Backbone.View.extend({
        partials: {
            deleteButton: deleteButton,
            duplicateButton: duplicateButton,
            snapButton:snapButton
        },

        events: {
            'click button.delete': 'deleteBaseline',
            'click button.duplicate': 'duplicateBaseline',
            'click button.new-baseline': 'createBaseline'
        },

        initialize: function () {
            _.bindAll(this);
        },

        render: function () {

            var self = this;

            this.$el.html(Mustache.render(template, {i18n: App.config.i18n}, this.partials));
            this.bindDomElements();
            this.createBaselineButton.show();

            new ConfigurationItemCollection().fetch().success(function(collection){
                if(!collection.length){
                    self.$notifications.append(new AlertView({
                        type: 'info',
                        message: App.config.i18n.CREATE_PRODUCT_BEFORE_BASELINE
                    }).render().$el);
                }
            });

            this.$inputProductId.typeahead({
                source: function (query, process) {
                    $.getJSON(App.config.contextPath + '/api/workspaces/' + App.config.workspaceId + '/products', function (data) {
                        var ids = [];
                        _(data).each(function (d) {
                            ids.push(d.id);
                        });
                        process(ids);
                    });
                }
            });

            this.bindEvent();
            this.createBaselineView();
            return this;
        },

        bindDomElements: function () {
            this.$notifications = this.$el.find('.notifications').first();
            this.deleteButton = this.$('.delete');
            this.duplicateButton = this.$('.duplicate');
            this.createBaselineButton = this.$('.new-baseline');
            this.$inputProductId = this.$('#inputProductId');
        },

        bindEvent: function(){
            var _this = this;
            this.$inputProductId.change(function () {
                _this.createBaselineView();
            });
            this.delegateEvents();
        },

        createBaseline: function () {
            var baselineCreationView = new BaselineCreationView({collection:this.listView.collection,model:new ConfigurationItem()});
            window.document.body.appendChild(baselineCreationView.render().el);
            baselineCreationView.on('warning', this.onWarning);
            baselineCreationView.openModal();
        },

        createBaselineView: function () {
            if (this.listView) {
                this.listView.remove();
                this.changeDeleteButtonDisplay(false);
                this.changeDuplicateButtonDisplay(false);
            }
            if (this.$inputProductId.val()) {
                this.listView = new BaselinesListView({
                    collection: new BaselinesCollection({}, {type:'product',productId: this.$inputProductId.val()})
                }).render();
            } else {
                this.listView = new BaselinesListView({
                    collection: new BaselinesCollection({},{type:'product'})
                }).render();
            }
            this.$el.append(this.listView.el);
            this.listView.on('error', this.onError);
            this.listView.on('warning', this.onWarning);
            this.listView.on('delete-button:display', this.changeDeleteButtonDisplay);
            this.listView.on('duplicate-button:display', this.changeDuplicateButtonDisplay);
        },

        deleteBaseline: function () {
            this.listView.deleteSelectedBaselines();
        },

        duplicateBaseline: function () {
            var baselineDuplicateView = new BaselineDuplicateView({model: this.listView.getSelectedBaseline()});
            window.document.body.appendChild(baselineDuplicateView.render().el);
            baselineDuplicateView.openModal();
        },

        changeDeleteButtonDisplay: function (state) {
            if (state) {
                this.deleteButton.show();
            } else {
                this.deleteButton.hide();
            }
        },

        changeDuplicateButtonDisplay: function (state) {
            if (state) {
                this.duplicateButton.show();
            } else {
                this.duplicateButton.hide();
            }
        },

        onError:function(model, error){
            var errorMessage = error ? error.responseText : model;

            this.$notifications.append(new AlertView({
                type: 'error',
                message: errorMessage
            }).render().$el);
        },

        onWarning:function(model, error){
            var errorMessage = error ? error.responseText : model;

            this.$notifications.append(new AlertView({
                type: 'warning',
                message: errorMessage
            }).render().$el);
        }
    });

    return BaselinesContentView;
});
