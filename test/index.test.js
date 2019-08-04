import Enaml from '../src/index';

let env = new Enaml();

env.renderString(`
	{% extends 'note.html' %}
	{% block start %}
		{% set x = 100 %}
		Some {{ 1 + 2 }}
		{% set y %}
			Content of y
		{% endset %}
	{% endblock %}
	{% block main %}
		{# best content ever #}
		<div>Other content</div>
	{% endblock %}
`).then(console.log);