using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class LevelManager : MonoBehaviour {
    public static LevelManager main;

    public Transform startPoint;
    public Transform[] path;

    public int currency;

    private WebSocketManager socketManager;
    private bool isUpdatingFromServer = false;

    private void Awake() {
        main = this;
    }

    private void Start() {
        currency = 100;

        if (FindObjectOfType<MainThreadDispatcher>() == null) {
            new GameObject("MainThreadDispatcher").AddComponent<MainThreadDispatcher>();
        }

        socketManager = WebSocketManager.Instance;

        socketManager.OnConnected += OnSocketConnected;
        socketManager.OnDisconnected += OnSocketDisconnected;
        socketManager.OnGameStateReceived += OnGameStateReceived;

    }

    private void OnDestroy() {
        // Unregister events to prevent memory leaks
        if (socketManager != null) {
            socketManager.OnConnected -= OnSocketConnected;
            socketManager.OnDisconnected -= OnSocketDisconnected;
            socketManager.OnGameStateReceived -= OnGameStateReceived;
        }
    }

    private void OnSocketConnected() {
        Debug.Log("Socket connected, sending initial currency");
        socketManager.UpdateCurrency(currency);
    }

    private void OnSocketDisconnected() {
        Debug.Log("Socket disconnected");
        // Handle disconnection (maybe try to reconnect)
    }

    private void OnGameStateReceived(GameState state) {
        isUpdatingFromServer = true;

        // Update currency if it's different
        if (currency != state.Currency) {
            currency = state.Currency;
            Debug.Log($"Currency updated from server: {currency}");
        }

        isUpdatingFromServer = false;
    }

    public void IncreaseCurrency(int amount) {
        currency += amount;

        // Sync with backend if we're not currently updating from server
        if (!isUpdatingFromServer && socketManager != null && socketManager.IsConnected()) {
            socketManager.UpdateCurrency(currency);
        }
    }

    public bool SpendCurrency(int amount) {
        if (amount <= currency) {
            //Buy
            currency -= amount;

            // Sync with backend if we're not currently updating from server
            if (!isUpdatingFromServer && socketManager != null && socketManager.IsConnected()) {
                socketManager.UpdateCurrency(currency);
            }

            return true;
        } else {
            Debug.Log("No monies :<");
            return false;
        }
    }
}
