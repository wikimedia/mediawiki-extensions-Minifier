<?php

class JSUglifier implements IResourceFilter {
	/** @var Resource */
	private static $curl;

	public function filter( $js ) {
		return $this->performRequest(
			array( 'id' => md5( $js ) ),
			array(
				'code' => 'minify',
				'text' => $js,
			)
		);
	}

	/**
	 * @param array $urlParams
	 * @param array $postData
	 *
	 * @return string
	 */
	private function performRequest( array $urlParams, array $postData ) {
		global $wgMinifierConnectionOptions, $wgMinifierHost;

		if ( !self::$curl ) {
			$options = $wgMinifierConnectionOptions + array(
					CURLOPT_POST => true,
					CURLOPT_RETURNTRANSFER => true,
				);
			self::$curl = curl_init();
			curl_setopt_array( self::$curl, $options );
		}
		$query = $urlParams ? '?' . wfArrayToCgi( $urlParams ) : '';
		$url = "http://$wgMinifierHost/$query";
		curl_setopt( self::$curl, CURLOPT_URL, $url );
		curl_setopt( self::$curl, CURLOPT_POSTFIELDS, $postData );

		$result = curl_exec( self::$curl );
		if ( $result === false ) {
			throw new MinificationException( "Error performing minification request to $url: "
				. curl_error( self::$curl)
			);
		}

		$httpCode = curl_getinfo( self::$curl, CURLINFO_HTTP_CODE );
		if ( $httpCode != 200 ) {
			throw new MinificationException( "Minification request to $url ended with code $httpCode: $result" );
		}

		return $result;
	}
}