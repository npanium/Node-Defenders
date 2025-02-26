using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class Plot : MonoBehaviour {
    [Header("References")]
    [SerializeField] private SpriteRenderer sr;
    [SerializeField] private Color hoverColor;

    private GameObject nodeObj;
    public Node node;
    private Color startColor;

    private WebSocketManager socketManager;
    private bool isReady = false;

    private void Start() {
        startColor = sr.color;

        socketManager = WebSocketManager.Instance;

        if (socketManager != null) {
            socketManager.OnConnected += HandleSocketConnected;
            socketManager.OnDisconnected += HandleSocketDisconnected;
        } else {
            Debug.LogError("Failed to get WebSocketManager instance in Plot");
        }
    }

    private void OnDestroy() {
        // Clean up event subscriptions
        if (socketManager != null) {
            socketManager.OnConnected -= HandleSocketConnected;
            socketManager.OnDisconnected -= HandleSocketDisconnected;
        }
    }

    private void HandleSocketConnected() {
        isReady = true;
        Debug.Log("Plot received socket connected event");
    }

    private void HandleSocketDisconnected() {
        isReady = false;
        Debug.Log("Plot received socket disconnected event");
    }

    private void OnMouseEnter() {
        sr.color = hoverColor;
    }

    private void OnMouseExit() {
        sr.color = startColor;
    }

    private void OnMouseDown() {
        if (UIManager.main.IsHoveringUI()) return;

        if (nodeObj != null) {
            node.OpenUpgradeUI();
            return;
        };

        NodeTower nodeToBuild = BuildManager.main.GetSelectedNode();

        if (nodeToBuild.cost > LevelManager.main.currency) {
            Debug.Log("Not enough monies!");
            return;
        }

        LevelManager.main.SpendCurrency(nodeToBuild.cost);
        nodeObj = Instantiate(nodeToBuild.prefab, transform.position, Quaternion.identity);
        node = nodeObj.GetComponent<Node>();

        if (socketManager == null) {
            Debug.LogError("socketManager is null when placing node!");
        } else {
            Debug.Log($"WebSocketManager exists. Connection status:");
            Debug.Log($"- isReady flag: {isReady}");
            Debug.Log($"- socketManager.IsConnected(): {socketManager.IsConnected()}");
            socketManager.LogConnectionStatus(); // Make sure to add this method to WebSocketManager
        }

        // Try immediately
        TrySendNodePlacedEvent(nodeToBuild);

        // Also try after a short delay as backup
        StartCoroutine(TrySendNodePlacedEventDelayed(nodeToBuild));

    }
    private void TrySendNodePlacedEvent(NodeTower nodeToBuild) {
        if (socketManager != null && socketManager.IsConnected()) {
            // Send node placed event to backend
            socketManager.SendNodePlaced(nodeToBuild.name, nodeToBuild.cost);
            Debug.Log($"Notified backend about node placement: {nodeToBuild.name}, cost: {nodeToBuild.cost}");
        } else {
            Debug.LogWarning("Could not notify backend about node placement - socket not fully connected");
        }
    }

    private IEnumerator TrySendNodePlacedEventDelayed(NodeTower nodeToBuild) {
        // Try a few times with delays
        for (int i = 0; i < 3; i++) {
            yield return new WaitForSeconds(0.5f * (i + 1)); // Increasing delays

            if (socketManager != null && socketManager.IsConnected()) {
                socketManager.SendNodePlaced(nodeToBuild.name, nodeToBuild.cost);
                Debug.Log($"Delayed notification sent for node placement: {nodeToBuild.name}");
                yield break; // Exit if successful
            }
        }

        Debug.LogError("Failed to notify backend after multiple attempts - connection issues persist");
    }
}
