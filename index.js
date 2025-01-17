const _ = require('lodash');
const createRedirectionsFromArg = require('./lib/create-redirections-from-arg');
const createRedirectionsFromFrontmatters = require('./lib/create-redirections-from-frontmatters');

function escapeSingleQuotes(string) {
	return string.replace(/'/g, '\\\'');
}

function escapeDoubleQuotes(string) {
	return string.replace(/"/g, '\\"');
}

module.exports = (options = {}) => {
	const noindex = (typeof options.noindex === 'undefined') ? true : Boolean(options.noindex);
	const preserveHash = options.preserveHash ?
		{
			timeout: 1,
			...(_.isObject(options.preserveHash) ? options.preserveHash : {})
		} :
		null;

	return (files, _metalsmith, done) => {
		const argRedirections = options.redirections ?
			createRedirectionsFromArg(options.redirections, options) :
			[];
		const frontmattersRedirections = options.frontmatter ?
			createRedirectionsFromFrontmatters(files, options) :
			[];

		for (const {normalizedSource, normalizedDestination} of [
			...argRedirections,
			...frontmattersRedirections
		]) {
			const contents = Buffer.from(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    ${noindex ? '<meta name="robots" content="noindex">' : ''}
    <meta http-equiv="refresh" content="${
	preserveHash ? preserveHash.timeout : 0
};url=${escapeDoubleQuotes(normalizedDestination)}">
    <link rel="canonical" href="${escapeDoubleQuotes(normalizedDestination)}">
    <script>window.location.replace('${escapeSingleQuotes(
		normalizedDestination
	)}'${preserveHash ? ' + window.location.hash' : ''});</script>
  </head>
  <body>This page has been moved to <a href="${escapeDoubleQuotes(
		normalizedDestination
	)}">${normalizedDestination}</a></body>
</html>
`);
			files[_.trimStart(normalizedSource, '/')] = {contents};
		}

		done();
	};
};
