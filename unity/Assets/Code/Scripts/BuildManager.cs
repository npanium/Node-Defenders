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
        selectedNodeTower = _selectedNodeTower;
    }
}
