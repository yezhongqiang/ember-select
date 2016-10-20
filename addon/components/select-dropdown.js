import Ember from 'ember';
import layout from '../templates/components/select-dropdown';
import { BusSubscriberMixin } from 'ember-message-bus';
import { buildTree } from '../utils/tree';
import { bringInView } from '../utils/view';

const {
  Component,
  computed,
  get,
  isEmpty,
  isNone,
  isPresent,
  on,
  run
} = Ember;

export default Component.extend(BusSubscriberMixin, {
  layout,
  list: null,

  init() {
    this._super(...arguments);

    let options = this.getProperties('valueKey', 'labelKey');
    let model = this.get('model');
    let list = buildTree(model, options);

    this.setProperties({ list });
  },

  options: computed('token', 'model.[]', 'values.[]', function() {
    this.filterModel();

    return this.get('list');
  }),

  keyboard: on('select-key', function(event) {
    let selected = this.get('selected');

    switch (event.keyCode) {
      case 9: // TAB
      case 13: // Enter
        this.tabEnterKeys(selected);
        break;

      case 38: // Up
      case 40: // Down
        this.upDownKeys(selected);
        break;
    }
  }),

  actions: {
    hover(node) {
      let selected = this.get('selected');
      if (selected) {
        selected.set('isSelected', false);
      }

      this.set('selected', node);
      node.set('isSelected', true);
    },

    select(node) {
      this.attrs.select(node.content, true);
    }
  },

  /* Filter out existing selections. Mark everything
   visible if no search, otherwise update visiblity. */
  filterModel() {
    let list = this.get('list');
    let token = this.get('token');
    let values = this.get('values');

    list.forEach(el => el.set('isVisible', false));

    if (isPresent(values)) {
      list = list.filter(el => values.indexOf(el.content) === -1);
    }

    if (isEmpty(token)) {
      list.forEach(el => el.set('isVisible', true));
    } else {
      token = token.toLowerCase();
      this.setVisibility(list, token);
    }
  },

  // Prevent event bubbling up
  mouseDown(event) {
    event.preventDefault();
  },

  // Down: 40, Up: 38
  move(list, selected, direction) {
    if (isPresent(selected)) {
      selected.set('isSelected', false);
    }

    if (isEmpty(list)) {
      return;
    }

    let index = list.indexOf(selected);
    let node;

    if (direction === 38) {
      if (index !== -1) {
        node = list[index - 1];
      }

      if (isNone(node)) {
        node = list[list.length - 1];
      }
    } else if (direction === 40) {
      if (index !== -1) {
        node = list[index + 1];
      }

      if (isNone(node)) {
        node = list[0];
      }
    }

    this.set('selected', node);
    node.set('isSelected', true);

    run.next(this, bringInView, '.es-options', '.es-highlight');
  },

  setVisibility(list, token) {
    list
      .filter(el => get(el, 'name').toLowerCase().indexOf(token) > -1)
      .forEach(el => el.set('isVisible', true));
  },

  tabEnterKeys(selected) {
    if (selected && selected.get('isVisible')) {
      this.send('select', selected);
    } else {
      let token = this.get('freeText') ? this.get('token') : '';
      this.attrs.select(token);
    }
  },

  upDownKeys(selected) {
    let list = this.get('list').filterBy('isVisible');
    this.move(list, selected, event.keyCode);
  }
});