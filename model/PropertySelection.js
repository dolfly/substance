import isEqual from 'lodash/isEqual'
import isNumber from 'lodash/isNumber'
import Selection from './Selection'
import Coordinate from './Coordinate'
import Range from './Range'

/**
  A selection which is bound to a property. Implements {@link model/Selection}.

  @class
  @extends model/Selection

  @example

  ```js
  var propSel = doc.createSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 3,
    endOffset: 6
  });
*/
class PropertySelection extends Selection {

  constructor(path, startOffset, endOffset, reverse, containerId, surfaceId) {
    super()

    /**
      The path to the selected property.
      @type {String[]}
    */
    this.path = path;

    /**
      Start character position.
      @type {Number}
    */
    this.startOffset = startOffset;

    /**
      End character position.
      @type {Number}
    */
    this.endOffset = endOffset;

    /**
      Selection direction.
      @type {Boolean}
    */
    this.reverse = Boolean(reverse);

    this.containerId = containerId;

    /**
      Identifier of the surface this selection should be active in.
      @type {String}
    */
    this.surfaceId = surfaceId;

    if (!path || !isNumber(startOffset)) {
      throw new Error('Invalid arguments: `path` and `startOffset` are mandatory');
    }

    // dynamic adapters for Coordinate oriented implementations
    this._internal.start = new CoordinateAdapter(this, 'path', 'startOffset');
    this._internal.end = new CoordinateAdapter(this, 'path', 'endOffset');
    this._internal.range = new RangeAdapter(this);
  }

  /**
    Convert container selection to JSON.

    @returns {Object}
  */
  toJSON() {
    return {
      type: 'property',
      path: this.path,
      startOffset: this.startOffset,
      endOffset: this.endOffset,
      reverse: this.reverse,
      containerId: this.containerId,
      surfaceId: this.surfaceId
    };
  }

  isPropertySelection() {
    return true;
  }

  getType() {
    return 'property';
  }

  isNull() {
    return false;
  }

  isCollapsed() {
    return this.startOffset === this.endOffset;
  }

  isReverse() {
    return this.reverse;
  }

  equals(other) {
    return (
      Selection.prototype.equals.call(this, other) &&
      (this.start.equals(other.start) && this.end.equals(other.end))
    );
  }

  toString() {
    /* istanbul ignore next */
    return [
      "PropertySelection(", JSON.stringify(this.path), ", ",
      this.startOffset, " -> ", this.endOffset,
      (this.reverse?", reverse":""),
      (this.surfaceId?(", "+this.surfaceId):""),
      ")"
    ].join('');
  }

  /**
    Collapse a selection to chosen direction.

    @param {String} direction either left of right
    @returns {PropertySelection}
  */
  collapse(direction) {
    var offset;
    if (direction === 'left') {
      offset = this.startOffset;
    } else {
      offset = this.endOffset;
    }
    return this.createWithNewRange(offset, offset);
  }

  // Helper Methods
  // ----------------------

  getRange() {
    return this.range;
  }

  /**
    Get path of a selection, e.g. target property where selected data is stored.

    @returns {String[]} path
  */
  getPath() {
    return this.path;
  }

  getNodeId() {
    return this.path[0];
  }

  /**
    Get start character position.

    @returns {Number} offset
  */
  getStartOffset() {
    return this.startOffset;
  }

  /**
    Get end character position.

    @returns {Number} offset
  */
  getEndOffset() {
    return this.endOffset;
  }

  /**
    Checks if this selection is inside another one.

    @param {Selection} other
    @param {Boolean} [strict] true if should check that it is strictly inside the other
    @returns {Boolean}
  */
  isInsideOf(other, strict) {
    if (other.isNull()) return false;
    if (other.isContainerSelection()) {
      return other.contains(this, strict);
    }
    if (strict) {
      return (isEqual(this.path, other.path) &&
        this.startOffset > other.startOffset &&
        this.endOffset < other.endOffset);
    } else {
      return (isEqual(this.path, other.path) &&
        this.startOffset >= other.startOffset &&
        this.endOffset <= other.endOffset);
    }
  }

  /**
    Checks if this selection contains another one.

    @param {Selection} other
    @param {Boolean} [strict] true if should check that it is strictly contains the other
    @returns {Boolean}
  */
  contains(other, strict) {
    if (other.isNull()) return false;
    return other.isInsideOf(this, strict);
  }

  /**
    Checks if this selection overlaps another one.

    @param {Selection} other
    @param {Boolean} [strict] true if should check that it is strictly overlaps the other
    @returns {Boolean}
  */
  overlaps(other, strict) {
    if (other.isNull()) return false;
    if (other.isContainerSelection()) {
      // console.log('PropertySelection.overlaps: delegating to ContainerSelection.overlaps...');
      return other.overlaps(this);
    }
    if (!isEqual(this.path, other.path)) return false;
    if (strict) {
      return (! (this.startOffset>=other.endOffset||this.endOffset<=other.startOffset) );
    } else {
      return (! (this.startOffset>other.endOffset||this.endOffset<other.startOffset) );
    }
  }

  /**
    Checks if this selection has the right boundary in common with another one.

    @param {Selection} other
    @returns {Boolean}
  */
  isRightAlignedWith(other) {
    if (other.isNull()) return false;
    if (other.isContainerSelection()) {
      // console.log('PropertySelection.isRightAlignedWith: delegating to ContainerSelection.isRightAlignedWith...');
      return other.isRightAlignedWith(this);
    }
    return (isEqual(this.path, other.path) &&
      this.endOffset === other.endOffset);
  }

  /**
    Checks if this selection has the left boundary in common with another one.

    @param {Selection} other
    @returns {Boolean}
  */
  isLeftAlignedWith(other) {
    if (other.isNull()) return false;
    if (other.isContainerSelection()) {
      // console.log('PropertySelection.isLeftAlignedWith: delegating to ContainerSelection.isLeftAlignedWith...');
      return other.isLeftAlignedWith(this);
    }
    return (isEqual(this.path, other.path) &&
      this.startOffset === other.startOffset);
  }

  /**
    Expands selection to include another selection.

    @param {Selection} other
    @returns {Selection} a new selection
  */
  expand(other) {
    if (other.isNull()) return this;

    // if the other is a ContainerSelection
    // we delegate to that implementation as it is more complex
    // and can deal with PropertySelections, too
    if (other.isContainerSelection()) {
      return other.expand(this);
    }
    if (!isEqual(this.path, other.path)) {
      throw new Error('Can not expand PropertySelection to a different property.');
    }
    var newStartOffset = Math.min(this.startOffset, other.startOffset);
    var newEndOffset = Math.max(this.endOffset, other.endOffset);
    return this.createWithNewRange(newStartOffset, newEndOffset);
  }

  /**
    Creates a new selection by truncating this one by another selection.

    @param {Selection} other
    @returns {Selection} a new selection
  */
  truncateWith(other) {
    if (other.isNull()) return this;
    if (other.isInsideOf(this, 'strict')) {
      // the other selection should overlap only on one side
      throw new Error('Can not truncate with a contained selections');
    }
    if (!this.overlaps(other)) {
      return this;
    }
    var otherStartOffset, otherEndOffset;
    if (other.isPropertySelection()) {
      otherStartOffset = other.startOffset;
      otherEndOffset = other.endOffset;
    } else if (other.isContainerSelection()) {
      // either the startPath or the endPath must be the same
      if (isEqual(other.startPath, this.path)) {
        otherStartOffset = other.startOffset;
      } else {
        otherStartOffset = this.startOffset;
      }
      if (isEqual(other.endPath, this.path)) {
        otherEndOffset = other.endOffset;
      } else {
        otherEndOffset = this.endOffset;
      }
    } else {
      return this;
    }

    var newStartOffset;
    var newEndOffset;
    if (this.startOffset > otherStartOffset && this.endOffset > otherEndOffset) {
      newStartOffset = otherEndOffset;
      newEndOffset = this.endOffset;
    } else if (this.startOffset < otherStartOffset && this.endOffset < otherEndOffset) {
      newStartOffset = this.startOffset;
      newEndOffset = otherStartOffset;
    } else if (this.startOffset === otherStartOffset) {
      if (this.endOffset <= otherEndOffset) {
        return Selection.nullSelection;
      } else {
        newStartOffset = otherEndOffset;
        newEndOffset = this.endOffset;
      }
    } else if (this.endOffset === otherEndOffset) {
      if (this.startOffset >= otherStartOffset) {
        return Selection.nullSelection;
      } else {
        newStartOffset = this.startOffset;
        newEndOffset = otherStartOffset;
      }
    } else if (other.contains(this)) {
      return Selection.nullSelection;
    } else {
      // FIXME: if this happens, we have a bug somewhere above
      throw new Error('Illegal state.');
    }
    return this.createWithNewRange(newStartOffset, newEndOffset);
  }

  /**
    Creates a new selection with given range and same path.

    @param {Number} startOffset
    @param {Number} endOffset
    @returns {Selection} a new selection
  */
  createWithNewRange(startOffset, endOffset) {
    var sel = new PropertySelection(this.path, startOffset, endOffset, false, this.containerId, this.surfaceId);
    var doc = this._internal.doc;
    if (doc) {
      sel.attach(doc);
    }
    return sel;
  }

  /**
    Return fragments for a given selection.

    @returns {Selection.Fragment[]}
  */
  getFragments() {
    if(this._internal.fragments) {
      return this._internal.fragments;
    }

    var fragments;

    if (this.isCollapsed()) {
      fragments = [new Selection.Cursor(this.path, this.startOffset)];
    } else {
      fragments = [new Selection.Fragment(this.path, this.startOffset, this.endOffset)];
    }

    this._internal.fragments = fragments;
    return fragments;
  }

  _clone() {
    return new PropertySelection(this.path, this.startOffset, this.endOffset, this.reverse, this.containerId, this.surfaceId);
  }

}

Object.defineProperties(PropertySelection.prototype, {
  /**
    @property {Coordinate} PropertySelection.start
  */
  start: {
    get: function() {
      return this._internal.start;
    },
    set: function() { throw new Error('PropertySelection.prototype.start is read-only.'); },
    enumerable: false
  },
  /**
    @property {Coordinate} PropertySelection.end
  */
  end: {
    get: function() {
      return this._internal.end;
    },
    set: function() { throw new Error('PropertySelection.prototype.end is read-only.'); },
    enumerable: false
  },
  range: {
    get: function() {
      return this._internal.range;
    },
    set: function() { throw new Error('PropertySelection.prototype.range is read-only.'); },
    enumerable: false
  },

  // making this similar to ContainerSelection
  startPath: {
    get: function() {
      return this.path;
    },
    set: function() { throw new Error('immutable.'); },
    enumerable: false
  },
  endPath: {
    get: function() {
      return this.path;
    },
    set: function() { throw new Error('immutable.'); },
    enumerable: false
  },
});

PropertySelection.fromJSON = function(json) {
  var path = json.path;
  var startOffset = json.startOffset;
  var endOffset = json.hasOwnProperty('endOffset') ? json.endOffset : json.startOffset;
  var reverse = json.reverse;
  var containerId = json.containerId;
  var surfaceId = json.surfaceId;
  return new PropertySelection(path, startOffset, endOffset, reverse, containerId, surfaceId);
}

/*
  Adapter for Coordinate oriented implementations.
  E.g. Coordinate transforms can be applied to update selections
  using OT.
*/
class CoordinateAdapter extends Coordinate {

  constructor(propertySelection, pathProperty, offsetProperty) {
    super('SKIP')

    this._sel = propertySelection;
    this._pathProp = pathProperty;
    this._offsetProp = offsetProperty;
    Object.freeze(this);
  }

}

Object.defineProperties(CoordinateAdapter.prototype, {
  path: {
    get: function() {
      return this._sel[this._pathProp];
    },
    set: function(path) {
      this._sel[this._pathProp] = path;
    }
  },
  offset: {
    get: function() {
      return this._sel[this._offsetProp];
    },
    set: function(offset) {
      this._sel[this._offsetProp] = offset;
    }
  }
});

PropertySelection.CoordinateAdapter = CoordinateAdapter;

class RangeAdapter extends Range {

  constructor(sel) {
    super('SKIP')
    this._sel = sel;
    this.start = sel.start;
    this.end = sel.end;
    Object.freeze(this);
  }

}

Object.defineProperties(RangeAdapter.prototype, {
  reverse: {
    get: function() {
      return this._sel.reverse;
    },
    set: function(reverse) {
      this._sel.reverse = reverse;
    }
  },
  containerId: {
    get: function() {
      return this._sel.containerId;
    },
    set: function(containerId) {
      this._sel.containerId = containerId;
    }
  },
  surfaceId: {
    get: function() {
      return this._sel.surfaceId;
    },
    set: function(surfaceId) {
      this._sel.surfaceId = surfaceId;
    }
  },
});

PropertySelection.RangeAdapter = RangeAdapter;

export default PropertySelection
