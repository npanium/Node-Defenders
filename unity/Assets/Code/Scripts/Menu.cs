using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using TMPro;

public class Menu : MonoBehaviour {
    [Header("References")]
    [SerializeField] TextMeshProUGUI currencyUI;
    [SerializeField] Animator anim;

    private bool isMenuOpen = true;
    private Plot selectedPlot;
    private Node selectedNode;


    public void ToggleMenu() {
        isMenuOpen = !isMenuOpen;
        anim.SetBool("MenuOpen", isMenuOpen);
    }

    private void Update() {
        // Update currency UI in Update instead of OnGUI for better performance
        if (currencyUI != null && LevelManager.main != null) {
            currencyUI.text = LevelManager.main.currency.ToString();
        }
    }

    public void SetSelectedPlot(Plot plot) {
        selectedPlot = plot;
        Debug.Log("Selected plot set: " + plot.gameObject.name);

        // You could notify your NextJS system here if needed
        if (WsClient.Instance != null) {
            WsClient.Instance.SendWebSocketMessage("Plot selected: " + plot.gameObject.name);
        }
    }

    public void SetSelectedNode(Plot plot) {
        // Clear previous selection if any
        if (selectedPlot != null && selectedPlot != plot) {
            selectedPlot.DeselectNode();
        }

        selectedPlot = plot;
        selectedNode = plot.node;

        Debug.Log("Selected node: " + (selectedNode != null ? selectedNode.gameObject.name : "None") + " with ID: " + plot.nodeId);

        // Notify the WsClient about the node selection
        if (WsClient.Instance != null && !string.IsNullOrEmpty(plot.nodeId)) {
            WsClient.Instance.SelectNode(plot.nodeId);
        }
    }

    // Get the currently selected node
    public Node GetSelectedNode() {
        return selectedNode;
    }

    // Get the ID of the currently selected node
    public string GetSelectedNodeId() {
        return selectedPlot != null ? selectedPlot.nodeId : null;
    }
}
