# Sontag

> __Note:__ Sontag is currently a work-in-progress, check back soon!

A just-enough template language in the vein of [Twig](https://twig.symfony.com/), [Liquid](https://shopify.github.io/liquid/), [Jinja](http://jinja.palletsprojects.com/en/2.10.x/), and [Nunjucks](https://mozilla.github.io/nunjucks/). If you’re familiar with any of these, you’ll feel right at home with Sontag.

## A note on security

Just to get this out of the way: Sontag is written with static website generators in mind. The ones where you write the content and the templates yourself and the website gets built into static HTML files for other people to read and enjoy. 

It does __not__ include, at least for the time being, precautions such as autoescaping, nor protection against XSS attacks, nor a sandboxed environment. __Do not use it to generate dynamic output based on user-provided templates or content.__

Now, onwards to the good stuff.

## Installation

```bash
npm install sontag 
```

## Usage

```js
import Sontag from 'sontag';

const env = new Sontag('./templates', {});

const result = await env.renderString('Hello, {{ name }}!', {
	name: 'Dan'
}); // => Hello, Dan!
```

## API

#### `env.render(template, context = {})`

Render a template with the given `context`, asynchronously.

```js
const result = await env.render('index.son', {
	content: 'My content'
});
```

The template path is relative to the `cwd` defined when initializing the environment. You can also pass an array of templates, and the first found will be rendered.

```js
const result = await env.render(
	['post-special.son', 'post.son', 'index.son'],
	{
		content: 'My content'
	}
)
```

#### `env.renderString(str, context = {})`

Render a template string asynchronously.

```js
const result = await env.render(
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

#### `env.addTag(constructor)`

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
	singular() {
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

* __Expressions__ are marked with `{{ ... }}`
* __Tags__ are marked with `{% ... %}`
* __Comments__ are marked with `{# ... #}`

Everything else is plain text.

### Expressions

All the usual JavaScript operators are available inside tags and expressions. Alternative operators are implemented for compatibility with other templating languages, so you can use these if you prefer:

Operator | JavaScript equivalent
-------- | ---------------------
`a and b` | `a && b`
`a or b` | `a || b`
`not a` | `!a`
`x b-and y` | `x & y`
`x b-or y` | `x | y`
`x b-xor y` | `x ^ y`
`a // b` | `Math.floor(a / b)`
`a starts with b` | `a.startsWith(b)`
`a ends with b` | `a.endsWith(b)`
`a matches /regex/` | `a.match(/regex/)`
`a in b` | `b.includes(a)`
`a..b` | `[a, a+1, ..., b]`

The `|` operator is used to pipe values through [filters](#todo). Filters are functions registered on the Sontag environment which you pipe rather than invoke. You can think of something like `{{ post.title | capitalize | pick(10) }}` as being equivalent to `{{ pick(10, capitalize(post.title)) }}`.

> __Note:__ Since the `|` operator is reserved for filters, you’ll need to use the `b-or` operator whenever you need the _bitwise OR_ operator.

### Tags

#### `apply` 

Alias: `filter` (For compatibility with Nunjucks)

#### `block`

> __Open question:__ Does the block use the context in which it’s defined, or the context where it’s imported? (See also the `scoped` attribute).

#### `call`

#### `embed`

Include another template inside the current template (like `include`), but override any of its blocks (like `extends`):

```twig
{% embed 'components/note.son' %}
	{% block content %}
		The note’s content
	{% endblock %}
{% endembed %}
```

If you have a single block defined in the template you’re including, you can also skip the `block` tag and write directly:

```twig
{% embed 'components/note.son' %}
	The note’s content
{% endembed %}
```

You can also take advantage of the short `block` declaration:

```twig
{% embed 'components/note.son' %}
	{% block content "The note’s content" %}
{% endembed %}
```

By default the included template has access to the outer context. You can limit this by using the `only` keyword:

```twig
{% embed 'components/note.son' only %}
	{% block content "The note’s content" %}
{% endembed %}
```

You can pass additional content with the `with` keyword:

```twig
{% embed 'components/note.son' with { post: posts[0] } %}
	The block’s content
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

Inside a block, you can use [the `parent()` function](#todo) to get the original content of the block, as defined in the template we’re inheriting.

The `extends` tag, if present, needs to be the first tag in the template. Any content not included in a block will not get rendered. 

#### `for`

```twig
{% for post in posts %}
	<article>
		<h1>{{ post.title }}</h1>
		{{ post.content }}
	</article>
{% endfor %}
```

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

#### `block()`

#### `dump(object)`

Output the stringified JSON of an object in the template, to inspect and debug. 

```twig
{{ dump(post.title) }}
```

#### `include(template, context = {}, with_context = true, ignore_missing = false)`

The function equivalent of [the `include` tag](#todo).

#### `parent()`

Alias: `super()` (for compatibility with Nunjucks)

Inside a `block` tag, outputs the content of the block as defined in the template we’re referencing in the [`extends`](#todo) or [`embed`](#todo) tag. 

```twig
{% extends "base.son" %}
{% block start %}
	{{ parent() }}
	Extra content
{% endblock %}
```

#### `source()`

### Filters

#### `batch(number)`

#### `default(value)`