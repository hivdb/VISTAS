import React from 'react';
import PropTypes from 'prop-types';
import {IoIosClose} from '@react-icons/all-files/io/IoIosClose';

import style from './style.module.scss';

Modal.propTypes = {
  onClose: PropTypes.func.isRequired,
  closeOnBlur: PropTypes.bool.isRequired,
  minHeight: PropTypes.oneOfType([
    PropTypes.number, PropTypes.string
  ]),
  width: PropTypes.oneOfType([
    PropTypes.number, PropTypes.string
  ]),
  children: PropTypes.node.isRequired
};

Modal.defaultProps = {
  closeOnBlur: true
};


export default function Modal({
  onClose,
  closeOnBlur,
  minHeight,
  width,
  children
}) {

  const handleModalClick = React.useCallback(
    e => {
      if (!closeOnBlur) {
        return;
      }
      if ('generalModal' in e.target.dataset) {
        // close on blur
        onClose();
      }
    },
    [closeOnBlur, onClose]
  );

  const addStyle = {};
  if (width) {
    addStyle.width = width;
  }
  if (minHeight) {
    addStyle.minHeight = minHeight;
  }

  return (
    <div
     className={style['general-modal']}
     onClick={handleModalClick}
     data-general-modal>
      <div className={style['dialog']} style={addStyle}>
        <button
         type="button"
         name="close" onClick={onClose}>
          <IoIosClose />
        </button>
        <div className={style['dialog-container']}>
          {children}
        </div>
      </div>
    </div>
  );

}
