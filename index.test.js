import Feuille from './index';

let env = new Feuille();

env.renderString(`
	{% extends 'note.html' %}
	{% block start %}
		Some content
	{% endblock %}
	{% block main %}
		{# best content ever #}
		<div>Other content</div>
	{% endblock %}
`).then(console.log);