using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class BuildManager : MonoBehaviour {
    public static BuildManager main;

    [Header("References")]
    [SerializeField] private GameObject[] nodePrefabs;

    private int selectedNode = 0;

    private void Awake() {
        main = this;
    }

    public GameObject GetSelectedNode() {
        return nodePrefabs[selectedNode];
    }
}
