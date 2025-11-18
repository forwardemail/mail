import { AskPopupView } from 'View/Popup/Ask';
import { SettingsUserStore } from 'Stores/User/Settings';

export const Passphrases = new WeakMap();

// Session-scoped auto-decrypt flag
let autoDecryptEnabled = false;

Passphrases.setAutoDecrypt = (enabled) => {
	autoDecryptEnabled = enabled;
	if (enabled) {
		console.log('🔓 Auto-decrypt enabled for this session');
	} else {
		console.log('🔒 Auto-decrypt disabled');
	}
};

Passphrases.isAutoDecryptEnabled = () => autoDecryptEnabled;

Passphrases.ask = async (key, sAskDesc, btnText) => {
	if (Passphrases.has(key)) {
		return {password: Passphrases.handle(key), remember: false};
	}

	// Show passphrase dialog
	const result = await AskPopupView.password(sAskDesc, btnText, 5);

	// If user chose to remember and auto-decrypt preference is enabled
	if (result && result.remember && SettingsUserStore.autoDecryptPGP()) {
		Passphrases.setAutoDecrypt(true);
	}

	return result;
};

const timeouts = {};
// get/set accessor to control deletion after N minutes of inactivity
Passphrases.handle = (key, pass) => {
	const timeout = SettingsUserStore.keyPassForget();
	if (timeout && !timeouts[key]) {
		timeouts[key] = (()=>Passphrases.delete(key)).debounce(timeout * 1000);
	}
	pass && Passphrases.set(key, pass);
	timeout && timeouts[key]();
	return Passphrases.get(key);
};
