# `Stylish.configure`

Stylish allows you to configure certain options globally using `Stylish.configure`. You pass this function an object with your updated values for the configuration options. The following options can be updated:

- `identifier` (`string`, defaults to `'styled'`): the `prop` Stylish looks at for every node to determine what styles, if any, should be applied. You can configure this on a per-connection basis with the `options` argument to `Stylish.connect`, or configure it globally by setting this option.

- `depth` (`string | number | false`, defaults to `'smart'`): how deep into rendering trees style resolution should go. It can be a number (for an explicit depth) or `false` (to traverse the entire tree). You can configure this on a per-connection basis with the `options` argument to `Stylish.connect`, or configure it globally by setting this option.

- `pseudo` (`boolean`, defaults to `false`): whether or not "pseudo mode" is enabled. Many plugins will look for `:`-prefixed keys, instead of the default string keys, if pseudo mode is enabled (for example, you would use `:hover` instead of `hover` for those rules).

- `plugins` (`[Plugin]`, default depends on whether you are using React DOM or React Native): all plugins that will be run (across all [plugin hooks]()). Note that if you wish to add to the default plugins, rather than fully overwriting them, you can use `addPlugins`, detailed below.

## `Stylish.configure.addPlugins`

If you wish to add additional plugins (for example, custom ones you wrote), you can *append* them to the list of existing plugins using `Stylish.configure.addPlugins`. This function accepts any number of plugins as regular arguments:

```javascript
import {configure} from 'react-stylish';
configure.addPlugins(MyCustomPlugin, MyOtherPlugin);
```
