# Sontag

> __Note:__ Sontag is currently a work-in-progress!

The just-enough template language.

## Installation

```bash
# with npm
npm install sontag 

# with yarn
yarn add sontag
```

## Usage

## API

#### `env.render(template, context = {})`

Render a template with the given `context`, asynchronously.

```js
let result = await env.render('index.son', {
	content: 'My content'
});
```

The template path is relative to the `cwd` defined when initializing the environment. You can also pass an array of templates, and the first found will be rendered.

```js
let result = await env.render(
	['post-special.son', 'post.son', 'index.son'],
	{
		content: 'My content'
	}
)
```

#### `env.renderString(str, context = {})`

Render a template string asynchronously.

```js
let result = await env.render(
	"Content: {{ content }}",
	{
		content: 'My content'
	}
);
```

#### `env.addFilter(name, filter)` 

Add a custom filter to the Sontag environment. The filter function will receive the arguments passed to it in templates.

```js
function myFilter(arg1, arg2, ...args) {
	this // refers to the Sontag environment
}
```

The filter function can optionally be asynchronous (using the `async` keyword in front of the function declaration).

### `env.addTag(constructor)`

Add a custom tag to the Sontag environment. The tag needs to inherit the `types.Tag` class. There are a few relevant properties, described below:

```js
import { types } from 'sontag';

class MyTag extends types.Tag {
	// Which tags can be used in templates.
	// In the example below, you'd use {% mytag %} ... {% endmytag %}
	static tagNames = ['mytag'];

	// Whether the tag is self-closing or paired. 
	// This aspect of the tag can also be determined
	// at runtime, if the class implements the singular() 
	// getter function as shown below.
	static singular = false;

	// Some tags work both as self-closing or paired,
	// depending on the signature used in templates.
	// Use this getter to decide at run-time whether the 
	// tag is self-closing.
	get singular() {
		if (some_condition) {
			return true;
		} else {
			return false;
		}
	}
}

env.addTag(MyTag);
```

## Templates

### Tags

#### `apply` 

Alias: `filter` (For compatibility with Nunjucks)

#### `block`

> __Open question:__ Does the block use the context in which it's defined, or the context where it's imported? (See also the `scoped` attribute).

#### `call`

#### `embed`

Include another template inside the current template (like `include`), but override any of its blocks (like `embed`):

```twig
{% embed 'components/note.son' %}
	{% block content %}
		The note's content
	{% endblock %}
{% endembed %}
```

If you have a single block defined in the template you're including, you can also skip the `block` tag and write directly:

```twig
{% embed 'components/note.son' %}
	The note's content
{% endembed %}
```

You can also take advantage of the short `block` declaration:

```twig
{% embed 'components/note.son' %}
	{% block content "The note's content" %}
{% endembed %}
```

By default the included template has access to the outer context. You can limit this by using the `only` keyword:

```twig
{% embed 'components/note.son' only %}
	{% block content "The note's content" %}
{% endembed %}
```

You can pass additional content with the `with` keyword:

```twig
{% embed 'components/note.son' with { post: posts[0] } %}
	The block's content
{% endembed %}
```

#### `extends`

Extend another template by overriding any `block` it defines:

__templates/base.son__
```twig
<!doctype html>
<html>
<head>
	<title>My Website</title>
</head>
<body>
	{% block content %}

	<!-- no content by default --> 

	{% endblock %}
</body>
</html>
```

__templates/my-page.son__
```twig
{% extends 'base.son' %}
{% block content %}
	My page content
{% endblock %}
```

Inside a block, you can use [the `parent()` function](#todo) to get the original content of the block, as defined in the template we're inheriting.

The `extends` tag, if present, needs to be the first tag in the template. Any content not included in a block will not get rendered. 

#### `for`

#### `if`

#### `import`

#### `include`

Include another template inside the current template.

```twig
{% include 'components/header.son' %}

Main content goes here

{% include 'components/footer.son' %}
```

The template name can be any expression:

```twig
{% include 'components/note-' + post.type + '.son' %}
```

See also:

* the [`include` function](#todo)
* the [`embed` tag](#todo)

#### `macro`

#### `raw`

Alias: `verbatim` (for compatibility with Twig)

#### `set`

Alias: `capture`, `assign` (for compatibility with Liquid)

Assigns a value to a variable:

```twig
{% set month = "August" %}
```

It also has a paired version, which assigns the content of the tag to the variable name:

```twig
{% set month %}August{% endset %}
```

#### `use`

#### `with`

Declare a new variable scope. 

By default we have access to the outer scope inside the `with` tag, but we can limit that by using the `only` keyword:

```twig
{% with { title: "Hello" } only %}
The title is: {{ title }}
{% endwith %}
```

### Functions

#### `dump(variable)`

Output the stringified JSON of a variable in the template. 

```twig
{{ dump(post.title) }}
```

#### `parent()`

Inside a `block` tag, outputs the content of the block as defined in the template we're extending. 

```twig
{% extends "base.son" %}
{% block start %}
	{{ parent() }}
	Extra content
{% endblock %}
```

> Note: this is the same function as Nunjuck's `super()`, but JavaScript does not allow us to call it that.