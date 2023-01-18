import * as React from 'react';
import { useCustomTranslation } from '@odf/shared/useCustomTranslationHook';
import { ExpandIcon } from '@patternfly/react-icons';
import SearchBar from './SearchComponent';
import './TopologySearch.scss';

const TopologySearchBar: React.FC = () => {
  const [isFullScreen, setFullScreen] = React.useState(false);
  const { t } = useCustomTranslation();

  // Handles for when user exits full screen via `Esc` button
  React.useEffect(() => {
    const handler = () => {
      if (window.screenTop && window.screenY && isFullScreen) {
        setFullScreen(false);
      }
    };
    document.addEventListener('fullscreenchange', handler);
    return () => {
      document.removeEventListener('fullscreenchange', handler);
    };
  }, [isFullScreen]);

  const toggleFullScreen = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.stopPropagation();
    const element = document.getElementById('odf-topology');
    if (!isFullScreen) {
      element
        .requestFullscreen()
        .then(() => {
          setFullScreen(true);
        })
        // eslint-disable-next-line no-console
        .catch((e) => console.error(e));
    } else {
      document
        .exitFullscreen()
        .then(() => {
          setFullScreen(false);
        })
        // eslint-disable-next-line no-console
        .catch((e) => console.error(e));
    }
  };
  return (
    <div className="odf-topology-search-bar">
      <span className="odf-topology-search-bar__search">
        <SearchBar />
      </span>
      <span
        className="odf-topology-search-bar__expand"
        onClick={toggleFullScreen}
      >
        <a onClick={toggleFullScreen}>
          <ExpandIcon className="odf-topology-search-bar__expand-icon" />
          {!isFullScreen ? t('Expand to fullscreen') : t('Exit fullscreen')}
        </a>
      </span>
    </div>
  );
};

export default TopologySearchBar;
