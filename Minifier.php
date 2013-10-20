<?php

if ( !defined( 'MEDIAWIKI' ) ) {
	echo( "This is an extension to the MediaWiki package and cannot be run standalone.\n" );
	die;
}

$wgExtensionCredits['other'][] = array(
	'path' => __FILE__,
	'name' => 'Minifier',
	'author' => array( 'Max Semenik' ),
	'descriptionmsg' => 'minifier-desc',
	'url' => 'https://www.mediawiki.org/wiki/Extension:Minifier',
);

$wgAutoloadClasses['JSUglifier'] = __DIR__ . '/Minifier.body.php';
$wgResourceFilters['minify-js'] = 'JSUglifier';

$wgMinifierHosts = array();

$wgMinifierConnectionOptions = array(
	// Examples:
	//'connectTimeout' => 10,
	//'timeout' => 10000,
);