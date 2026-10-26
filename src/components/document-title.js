import PropTypes from 'prop-types';
import React from 'react';


DocumentTitle.propTypes = {
  siteTitle: PropTypes.string.isRequired,
  pageTitle: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired
};

DocumentTitle.defaultProps = {
  siteTitle: 'HIV Drug Resistance Database',
  pageTitle: ''
};

export function setTitle(siteTitle, pageTitle) {
  let title;
  if (pageTitle === '') {
    title = siteTitle;
  }
  else {
    title = `${pageTitle} - ${siteTitle}`;
  }
  document.title = title;
}


export default function DocumentTitle({children, siteTitle, pageTitle}) {
  setTitle(siteTitle, pageTitle);
  if (children && children.length) {
    return <div>{children}</div>;
  } else {
    return children;
  }
}
