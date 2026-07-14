package com.example.umbra

import android.os.Environment
import android.util.Log
import java.io.File
import java.io.FileWriter
import java.io.IOException
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

enum class LogLevel(val value: Int, val tag: String) {
    VERBOSE(2, "V"),
    DEBUG(3, "D"),
    INFO(4, "I"),
    WARN(5, "W"),
    ERROR(6, "E"),
    ASSERT(7, "A")
}

object UmbraLogger {

    private const val MAX_TAG_LENGTH = 23
    private const val LOG_DIR = "umbra_logs"
    private const val LOG_FILE = "umbra_build.log"
    private const val MAX_LOG_SIZE = 5L * 1024 * 1024

    private var minLogLevel: LogLevel = LogLevel.DEBUG
    private var fileLoggingEnabled = true
    private var logFile: File? = null

    private val dateFormat = SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS", Locale.US)
    private val fileDateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.US)

    fun init(minLevel: LogLevel = LogLevel.DEBUG, enableFileLogging: Boolean = true) {
        minLogLevel = minLevel
        fileLoggingEnabled = enableFileLogging
        if (enableFileLogging) {
            initializeLogFile()
        }
        i("UmbraLogger", "Logger initialized | minLevel=${minLevel.tag} | fileLogging=$enableFileLogging")
    }

    private fun initializeLogFile() {
        try {
            val logDir = if (isExternalStorageWritable()) {
                File(Environment.getExternalStorageDirectory(), LOG_DIR)
            } else {
                File(Environment.getDataDirectory(), "data/com.example.umbra/files/$LOG_DIR")
            }
            if (!logDir.exists()) logDir.mkdirs()
            val today = fileDateFormat.format(Date())
            logFile = File(logDir, "${LOG_FILE}_$today")
            if (logFile!!.exists() && logFile!!.length() > MAX_LOG_SIZE) {
                rotateLogFile(logDir)
            }
        } catch (e: Exception) {
            Log.e("UmbraLogger", "Failed to initialize log file", e)
            fileLoggingEnabled = false
        }
    }

    private fun isExternalStorageWritable(): Boolean {
        return Environment.getExternalStorageState() == Environment.MEDIA_MOUNTED
    }

    private fun rotateLogFile(logDir: File) {
        val archive = File(logDir, "${LOG_FILE}_${System.currentTimeMillis()}.old")
        logFile?.renameTo(archive)
        logFile = File(logDir, "${LOG_FILE}_${fileDateFormat.format(Date())}")
    }

    fun v(tag: String, message: String, vararg args: Any?) {
        log(LogLevel.VERBOSE, tag, message, *args)
    }

    fun d(tag: String, message: String, vararg args: Any?) {
        log(LogLevel.DEBUG, tag, message, *args)
    }

    fun i(tag: String, message: String, vararg args: Any?) {
        log(LogLevel.INFO, tag, message, *args)
    }

    fun w(tag: String, message: String, vararg args: Any?) {
        log(LogLevel.WARN, tag, message, *args)
    }

    fun e(tag: String, message: String, vararg args: Any?) {
        log(LogLevel.ERROR, tag, message, *args)
    }

    fun e(tag: String, message: String, throwable: Throwable?) {
        log(LogLevel.ERROR, tag, message + (throwable?.let { ": ${it.message}" } ?: ""))
    }

    fun wtf(tag: String, message: String, vararg args: Any?) {
        log(LogLevel.ASSERT, tag, message, *args)
    }

    private fun log(level: LogLevel, tag: String, message: String, vararg args: Any?) {
        if (level.value < minLogLevel.value) return

        val formattedTag = sanitizeTag(tag)
        val formattedMessage = if (args.isNotEmpty()) {
            try {
                message.format(*args)
            } catch (e: Exception) {
                "$message ${args.contentToString()}"
            }
        } else {
            message
        }

        val enriched = enrichMessage(level, formattedTag, formattedMessage)

        when (level) {
            LogLevel.VERBOSE -> Log.v(formattedTag, formattedMessage)
            LogLevel.DEBUG -> Log.d(formattedTag, formattedMessage)
            LogLevel.INFO -> Log.i(formattedTag, formattedMessage)
            LogLevel.WARN -> Log.w(formattedTag, formattedMessage)
            LogLevel.ERROR -> Log.e(formattedTag, formattedMessage)
            LogLevel.ASSERT -> Log.wtf(formattedTag, formattedMessage)
        }

        if (fileLoggingEnabled) {
            writeToFile(enriched)
        }
    }

    private fun sanitizeTag(tag: String): String {
        return if (tag.length > MAX_TAG_LENGTH) {
            tag.substring(0, MAX_TAG_LENGTH)
        } else {
            tag
        }
    }

    private fun enrichMessage(level: LogLevel, tag: String, message: String): String {
        val timestamp = dateFormat.format(Date())
        val threadInfo = Thread.currentThread()
        return "[$timestamp] [${level.tag}] [$tag] (${threadInfo.name}) $message"
    }

    private fun writeToFile(line: String) {
        val file = logFile ?: return
        try {
            FileWriter(file, true).use { writer ->
                writer.write(line)
                writer.write(System.lineSeparator())
                writer.flush()
            }
        } catch (e: IOException) {
            Log.e("UmbraLogger", "Failed to write log to file", e)
        }
    }

    fun getLogFile(): File? = logFile

    fun setLogLevel(level: LogLevel) {
        minLogLevel = level
        i("UmbraLogger", "Log level changed to ${level.tag}")
    }

    fun flush() {
        logFile?.let {
            try {
                FileWriter(it, true).use { writer ->
                    writer.flush()
                }
            } catch (e: IOException) {
                Log.e("UmbraLogger", "Failed to flush log file", e)
            }
        }
    }
}
