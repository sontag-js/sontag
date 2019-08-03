import Feuille from './index';

let env = new Feuille();

env.renderString(`
	{% extends 'note.html' %}
	{% block start %}
		Some {{ 1 + 2 }}
	{% endblock %}
	{% block main %}
		{# best content ever #}
		<div>Other content</div>
	{% endblock %}
`).then(console.log);