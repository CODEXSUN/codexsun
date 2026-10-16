package `in`.codexsun.codexsun_mobile

import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import java.util.UUID

class MainActivity : FlutterActivity() {
    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, "codexsun.codexsun/device")
            .setMethodCallHandler { call, result ->
                if (call.method != "deviceKey") {
                    result.notImplemented()
                } else {
                    val preferences = getSharedPreferences("codexsun.device", MODE_PRIVATE)
                    val key = preferences.getString("key", null)
                        ?: UUID.randomUUID().toString().replace("-", "").also {
                            preferences.edit().putString("key", it).apply()
                        }
                    result.success(key)
                }
            }
    }
}
