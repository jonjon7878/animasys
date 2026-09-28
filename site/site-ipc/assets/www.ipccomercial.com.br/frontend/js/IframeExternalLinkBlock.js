$(document).ready(function() {
	const urlParams = new URLSearchParams(window.location.search);
	const hasIframeShowCaseParam = urlParams.get('isIframeShowCase');
	const isIframeShowCase = sessionStorage.getItem('isIframeShowCase') && window.self !== window.top;

	if(hasIframeShowCaseParam || isIframeShowCase){
		sessionStorage.setItem('isIframeShowCase', 'true');

		$('a').on('click', (event) => {
			if (event.ctrlKey || event.shiftKey) {
					return false;
			}
		});

		$('a').on('contextmenu auxclick', (event) => {
				event.preventDefault();
		});

		$('a[target="_blank"]').on('click', (event) => {
			event.preventDefault();
		});
	}
});
