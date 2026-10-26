import React, {useState} from 'react';
import PropTypes from 'prop-types';

import style from './style.module.scss';

HoverText.propTypes = {
    text: PropTypes.string.isRequired,
    desc: PropTypes.string.isRequired
};


export default function HoverText({text, desc}) {
  let [isModalVisible, setIsModalVisible] = useState(false);

  isModalVisible = true;
  return (
    <>
      <p
       onMouseEnter={() => setIsModalVisible(true)}
       onMouseLeave={() => setIsModalVisible(false)}
      >
        {text}
      </p>

      {isModalVisible && (
        <div className={style['popups']}>
          {desc}
        </div>
      )}
    </>
  );
}
