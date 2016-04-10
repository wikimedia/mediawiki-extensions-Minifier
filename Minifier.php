<?php

if ( !defined( 'MEDIAWIKI' ) ) {
	echo( "This is a MediaWiki extension and cannot be run standalone.\n" );
	die;
}

$wgExtensionCredits['other'][] = array(
	'path' => __FILE__,
	'name' => 'Minifier',
	'author' => array( 'Max Semenik' ),
	'descriptionmsg' => 'minifier-desc',
	'url' => 'https://www.mediawiki.org/wiki/Extension:Minifier',
);

$wgMessagesDirs['Minifier'] = __DIR__ . '/i18n';

$wgAutoloadClasses['JSUglifier'] = __DIR__ . '/Minifier.body.php';
$wgAutoloadClasses['MinificationException'] = __DIR__ . '/MinificationException.php';
$wgResourceFilters['minify-js'] = 'JSUglifier';

/**
 * Host used by the minifier service with optional port
 */
$wgMinifierHost = 'localhost:8888';

/**
 * Array of cURL options
 */
$wgMinifierConnectionOptions = array(
	CURLOPT_CONNECTTIMEOUT_MS => 1000,
	CURLOPT_TIMEOUT_MS => 10000,
);
