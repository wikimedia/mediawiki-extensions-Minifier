<?php

class MinificationException extends MWException {
	public function __construct( $message ) {
		wfDebugLog( 'minifier', $message );
		parent::__construct( $message );
	}
}
