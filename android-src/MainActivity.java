package com.r3dm.nexusia;

import android.os.Bundle;
import android.os.Handler;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import android.view.Window;
import android.view.WindowManager;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.view.View;
import android.view.Gravity;
import android.content.Context;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {
    private WebView webView;
    private ProgressBar progressBar;
    private TextView statusText;
    private LinearLayout splashLayout;
    private boolean pageLoaded = false;
    private int retryCount = 0;
    private static final int MAX_RETRIES = 3;
    private Handler handler = new Handler();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED,
                             WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            getWindow().setStatusBarColor(Color.parseColor("#0a0000"));
            getWindow().setNavigationBarColor(Color.parseColor("#0a0000"));
        }

        // Layout principal
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Color.parseColor("#0a0000"));

        // ─── Splash / Loading Layout ───────────────────────────────────
        splashLayout = new LinearLayout(this);
        splashLayout.setOrientation(LinearLayout.VERTICAL);
        splashLayout.setGravity(Gravity.CENTER);
        splashLayout.setBackgroundColor(Color.parseColor("#0a0000"));
        splashLayout.setLayoutParams(new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f));

        // Título
        TextView title = new TextView(this);
        title.setText("NEXUSIA");
        title.setTextColor(Color.parseColor("#ff1a1a"));
        title.setTextSize(36);
        title.setTypeface(null, android.graphics.Typeface.BOLD);
        title.setGravity(Gravity.CENTER);
        title.setPadding(0, 0, 0, 20);
        splashLayout.addView(title);

        // Subtítulo
        TextView subtitle = new TextView(this);
        subtitle.setText("Cargando...");
        subtitle.setTextColor(Color.parseColor("#ff4444"));
        subtitle.setTextSize(14);
        subtitle.setGravity(Gravity.CENTER);
        subtitle.setPadding(0, 0, 0, 40);
        splashLayout.addView(subtitle);

        // Spinner personalizado
        ProgressBar spinner = new ProgressBar(this, null, android.R.attr.progressBarStyleLarge);
        spinner.getIndeterminateDrawable().setColorFilter(
            Color.parseColor("#ff1a1a"), android.graphics.PorterDuff.Mode.SRC_IN);
        splashLayout.addView(spinner);

        // Status text
        statusText = new TextView(this);
        statusText.setText("Conectando con el servidor...");
        statusText.setTextColor(Color.parseColor("#666666"));
        statusText.setTextSize(12);
        statusText.setGravity(Gravity.CENTER);
        statusText.setPadding(0, 30, 0, 0);
        splashLayout.addView(statusText);

        root.addView(splashLayout);

        // ─── Progress Bar ──────────────────────────────────────────────
        progressBar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progressBar.setLayoutParams(new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, 3));
        GradientDrawable gd = new GradientDrawable(
            GradientDrawable.Orientation.LEFT_RIGHT,
            new int[]{Color.parseColor("#ff1a1a"), Color.parseColor("#cc0000")});
        gd.setCornerRadius(0);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN) {
            progressBar.setProgressDrawable(gd);
        }
        progressBar.setMax(100);
        progressBar.setVisibility(View.GONE);
        root.addView(progressBar);

        // ─── WebView ───────────────────────────────────────────────────
        webView = new WebView(this);
        webView.setLayoutParams(new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f));
        webView.setVisibility(View.GONE);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setCacheMode(WebSettings.LOAD_NO_CACHE);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR1) {
            settings.setAllowUniversalAccessFromFileURLs(false);
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            settings.setSafeBrowsingEnabled(true);
        }

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
                statusText.setText("Cargando página...");
                progressBar.setVisibility(View.VISIBLE);
                progressBar.setProgress(0);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                if (!pageLoaded) {
                    pageLoaded = true;
                    splashLayout.setVisibility(View.GONE);
                    webView.setVisibility(View.VISIBLE);
                    progressBar.setVisibility(View.GONE);
                }
            }

            @Override
            public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                if (!pageLoaded) {
                    retryCount++;
                    if (retryCount <= MAX_RETRIES) {
                        statusText.setText("Reintentando conexión (" + retryCount + "/" + MAX_RETRIES + ")...");
                        handler.postDelayed(() -> {
                            webView.loadUrl("https://nexusia-app.vercel.app");
                        }, 2000);
                    } else {
                        statusText.setText("Error de conexión. ¿Tienes internet?");
                    }
                }
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                progressBar.setProgress(newProgress);
                if (newProgress > 50 && !pageLoaded) {
                    statusText.setText("Casi listo...");
                }
            }
        });

        // Cargar URL
        webView.loadUrl("https://nexusia-app.vercel.app");
        root.addView(webView);

        setContentView(root);
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (webView != null) webView.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) webView.onResume();
    }

    @Override
    protected void onDestroy() {
        if (webView != null) webView.destroy();
        super.onDestroy();
    }
}