using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class BuildManager : MonoBehaviour {
    public static BuildManager main;

    [Header("References")]
    [SerializeField] private NodeTower[] nodeTowers;

    private int selectedNodeTower = 0;

    private void Awake() {
        main = this;
    }

    public NodeTower GetSelectedNode() {
        return nodeTowers[selectedNodeTower];
    }

    public void SetSelectedNodeTower(int _selectedNodeTower) {

        // Validate index
        if (_selectedNodeTower >= 0 && _selectedNodeTower < nodeTowers.Length) {
            selectedNodeTower = _selectedNodeTower;
        } else {
            Debug.LogError("Invalid node tower index: " + _selectedNodeTower);
        }
    }

    public int GetSelectedNodeIndex() {
        return selectedNodeTower;
    }

    // Helper method to get a tower at a specific index without changing selection
    public NodeTower GetTowerAtIndex(int index) {
        if (index >= 0 && index < nodeTowers.Length) {
            return nodeTowers[index];
        } else {
            Debug.LogError("Tried to access invalid tower index: " + index);
            return null;
        }
    }
}
