package com.r3dm.nexusia;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import android.view.Window;
import android.view.WindowManager;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.FrameLayout;
import android.graphics.Color;
import android.os.Build;
import android.view.View;
import androidx.appcompat.app.AppCompatActivity;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.AdSize;
import com.google.android.gms.ads.AdView;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.interstitial.InterstitialAd;
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback;
import com.google.android.gms.ads.LoadAdError;

public class MainActivity extends AppCompatActivity {
    private WebView webView;
    private AdView adView;
    private InterstitialAd mInterstitialAd;
    private boolean adLoading = false;
    private ProgressBar progressBar;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED,
                             WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED);

        // Inicializar AdMob
        MobileAds.initialize(this, initializationStatus -> {});

        // Layout principal
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Color.parseColor("#0f0f1a"));

        // Progress bar
        progressBar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progressBar.setLayoutParams(new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, 4));
        progressBar.setProgressDrawable(getDrawable(android.R.drawable.progress_horizontal));
        progressBar.getProgressDrawable().setColorFilter(
            Color.parseColor("#7c3aed"), android.graphics.PorterDuff.Mode.SRC_IN);
        progressBar.setMax(100);
        root.addView(progressBar);

        // WebView
        webView = new WebView(this);
        webView.setLayoutParams(new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f));

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
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            settings.setSafeBrowsingEnabled(true);
        }

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
                progressBar.setVisibility(View.VISIBLE);
                progressBar.setProgress(0);
            }
            @Override
            public void onPageFinished(WebView view, String url) {
                progressBar.setVisibility(View.GONE);
                // Forzar modo oscuro
                webView.evaluateJavascript(
                    "(function(){document.documentElement.style.backgroundColor='#0f0f1a';" +
                    "var m=document.querySelector('meta[name=theme-color]');" +
                    "if(m)m.setAttribute('content','#0f0f1a');" +
                    "})();", null);
                // Cargar interstitial
                loadInterstitial();
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                progressBar.setProgress(newProgress);
            }
        });

        // Cargar URL
        webView.loadUrl("https://nexusia-app.vercel.app");
        root.addView(webView);

        // Banner AdMob
        adView = new AdView(this);
        adView.setAdUnitId("ca-app-pub-4903263409458961/8825147276");
        adView.setAdSize(AdSize.BANNER);
        AdRequest adRequest = new AdRequest.Builder().build();
        adView.loadAd(adRequest);
        root.addView(adView);

        setContentView(root);
    }

    private void loadInterstitial() {
        if (adLoading) return;
        adLoading = true;
        AdRequest req = new AdRequest.Builder().build();
        InterstitialAd.load(this, "ca-app-pub-4903263409458961/4622591073", req,
            new InterstitialAdLoadCallback() {
                @Override
                public void onAdLoaded(InterstitialAd ad) {
                    mInterstitialAd = ad;
                    adLoading = false;
                }
                @Override
                public void onAdFailedToLoad(LoadAdError err) {
                    adLoading = false;
                }
            });
    }

    private void showInterstitialIfReady() {
        if (mInterstitialAd != null) {
            mInterstitialAd.show(MainActivity.this);
            mInterstitialAd = null;
            loadInterstitial();
        }
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onPause() { super.onPause(); if (adView != null) adView.pause(); if (webView != null) webView.onPause(); }

    @Override
    protected void onResume() { super.onResume(); if (adView != null) adView.resume(); if (webView != null) webView.onResume(); }

    @Override
    protected void onDestroy() { if (adView != null) adView.destroy(); if (webView != null) webView.destroy(); super.onDestroy(); }
}