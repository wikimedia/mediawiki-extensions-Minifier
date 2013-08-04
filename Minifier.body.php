<?php

class JSUglifier implements IResourceFilter {
	private $options;

	public function __construct() {
		global $wgMinifierConnectionOptions;
		$this->options = $wgMinifierConnectionOptions;
		$this->options['method'] = 'POST';
	}

	public function filter( $js ) {
		wfProfileIn( __METHOD__ );
		$req = $this->getRequest();
		$req->setData( array(
			'code' => 'minify',
			'text' => $js,
		) );
		$req->execute();
		if ( $req->getStatus() != 200 ) {
			throw new MWException( 'Shit hit fan' );
		}
		wfProfileOut( __METHOD__ );
		return $req->getContent();
	}

	/**
	 * @return MWHttpRequest
	 */
	private function getRequest() {
		global $wgMinifierHosts;

		// @todo:
		return MWHttpRequest::factory( "http://{$wgMinifierHosts[0]}/", $this->options );
	}
}