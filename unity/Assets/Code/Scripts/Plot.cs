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

    // private WsClient wsClient;

    private void Start() {
        startColor = sr.color;

        // wsClient = FindObjectOfType<WsClient>();

        // if (wsClient != null) {
        //     Debug.Log("Plot: WsClient reference obtained");
        // } else {
        //     Debug.LogWarning("Plot: Failed to get WsClient reference");
        // }
    }

    private void OnMouseEnter() {
        sr.color = hoverColor;
    }

    private void OnMouseExit() {
        sr.color = startColor;
    }

    private void OnMouseDown() {
        if (UIManager.main.IsHoveringUI()) return;

        // if (wsClient != null) {
        //     wsClient.SendWebSocketMessage("Plot clicked");
        // }

        if (nodeObj != null) {
            node.OpenUpgradeUI();
            return;
        }

        // Get selected node from build manager
        NodeTower nodeToBuild = BuildManager.main.GetSelectedNode();
        if (nodeToBuild == null) {
            Debug.LogWarning("No node selected to build");
            return;
        }

        // Check if enough currency
        if (nodeToBuild.cost > LevelManager.main.currency) {
            Debug.Log("Not enough currency!");

            // if (wsClient != null) {
            //     wsClient.SendWebSocketMessage("Not enough currency for node. Required: " + nodeToBuild.cost + ", Available: " + LevelManager.main.currency);
            // }
            return;
        }

        // Spend currency
        LevelManager.main.SpendCurrency(nodeToBuild.cost);

        // if (wsClient != null) {
        //     int remainingCurrency = LevelManager.main.currency;
        //     wsClient.SendWebSocketMessage("Currency spent on node: " + nodeToBuild.cost + ", now: " + remainingCurrency);
        // }

        // Create node
        nodeObj = Instantiate(nodeToBuild.prefab, transform.position, Quaternion.identity);
        node = nodeObj.GetComponent<Node>();

        // if (wsClient != null) {
        //     wsClient.SendWebSocketMessage("Node created at position: " + transform.position);
        // }

        if (WsClient.Instance != null) {
            WsClient.Instance.NotifyNodePlaced(nodeToBuild.name);
        }

    }

    // Method for if a node is "destroyed" goes here

}