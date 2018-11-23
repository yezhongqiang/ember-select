'use strict';

module.exports = {
  name: require('./package').name,
  //add this to enable live reload when in developing.
  isDevelopingAddon: function() {
    return true;
  },
};
