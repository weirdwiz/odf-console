import * as React from 'react';

type PromiseComponent<Props extends object> = () => Promise<
  React.ComponentType<Props>
>;

enum AsyncComponentError {
  ComponentNotFound = 'COMPONENT_NOT_FOUND',
}

const MAX_RETRY_BASE = 25;

const sameLoader = <Props extends object>(
  a: PromiseComponent<Props>,
  b: PromiseComponent<Props>
) => a?.name === b?.name && (a || 'a').toString() === (b || 'b').toString();

// Todo: Improve this by having a proper basic loading component
const EmptyComponent: React.FC = () => null;

const loadComponentAt = <Props extends object>(
  loader: PromiseComponent<Props>,
  setComponent: (component: React.ComponentType<Props>) => void,
  count = 0
) =>
  loader()
    .then((c) => {
      if (!c) {
        return Promise.reject(AsyncComponentError.ComponentNotFound);
      }
      return setComponent(c);
    })
    .catch((err) => {
      if (err === AsyncComponentError.ComponentNotFound) {
        // eslint-disable-next-line no-console
        console.error('Could not mount component');
      } else {
        // eslint-disable-next-line no-console
        console.warn('Retrying');
        const retry = count + 1 < MAX_RETRY_BASE ? count + 1 : MAX_RETRY_BASE;
        setTimeout(
          () => loadComponentAt(loader, setComponent, count + 1),
          100 * retry ** 2
        );
      }
    });

const useAsynchronousLoading = <Props extends object>(
  loader: PromiseComponent<Props>
): [React.ComponentType<Props>, boolean] => {
  const Component = React.useRef<React.ComponentType<Props>>(null);
  const [loadingStarted, setLoadingStarted] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);

  const prevLoader = React.useRef<PromiseComponent<Props>>(null);

  const setComponent = React.useCallback(
    (value) => {
      Component.current = value;
      setLoaded(true);
    },
    [Component]
  );

  React.useEffect(() => {
    if (!loadingStarted && !sameLoader(prevLoader.current, loader)) {
      setLoadingStarted(true);
      loadComponentAt(loader, setComponent);
      prevLoader.current = loader;
    }
    return () => {
      setLoadingStarted(false);
    };
  }, [loader, loadingStarted, setLoadingStarted, setComponent]);

  return [Component.current, loaded];
};

export const AsyncLoader = <Props extends object>(
  props: AsyncComponentProps<Props>
): JSX.Element => {
  const { loader, LoadingComponent = EmptyComponent } = props;
  const [Component, loaded] = useAsynchronousLoading(loader);
  const componentProps = { ...props };
  Reflect.deleteProperty(componentProps, 'loader');
  Reflect.deleteProperty(componentProps, 'LoadingComponent');

  return loaded ? (
    React.createElement(Component, componentProps)
  ) : (
    <LoadingComponent />
  );
};

type AsyncComponentProps<Props extends object> = {
  loader: PromiseComponent<Props>;
  LoadingComponent?: React.FC;
} & Props;
