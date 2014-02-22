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
		$status = $req->execute();
		$err = '';
		if ( !$status->isGood() ) {
			$err = "Error requesting minification: {$status->getMessage()}";
		}
		$statusCode = $req->getStatus();
		$returnedText = $req->getContent();
		if ( $statusCode != 200 ) {
			$err = "Request to minifier ended with code $statusCode: $returnedText";
		}
		wfProfileOut( __METHOD__ );
		if ( $err ) {
			wfDebugLog( 'minifier', $err );
			throw new MWException( $err );
		}
		return $returnedText;
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