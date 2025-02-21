using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class Plot : MonoBehaviour {
    [Header("References")]
    [SerializeField] private SpriteRenderer sr;
    [SerializeField] private Color hoverColor;

    private GameObject node;
    private Color startColor;

    private void Start() {
        startColor = sr.color;
    }

    private void OnMouseEnter() {
        sr.color = hoverColor;
    }

    private void OnMouseExit() {
        sr.color = startColor;
    }

    private void OnMouseDown() {
        if (node != null) return;

        NodeTower nodeToBuild = BuildManager.main.GetSelectedNode();

        if (nodeToBuild.cost > LevelManager.main.currency) {
            Debug.Log("Not enough monies!");
            return;
        }

        LevelManager.main.SpendCurrency(nodeToBuild.cost);
        node = Instantiate(nodeToBuild.prefab, transform.position, Quaternion.identity);

    }
}
