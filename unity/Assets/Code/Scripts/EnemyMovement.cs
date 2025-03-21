using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class EnemyMovement : MonoBehaviour {
    [Header("References")]
    [SerializeField] private Rigidbody2D rb;

    [Header("Attributes")]
    [SerializeField] private float moveSpeed = 2f;

    private Transform target;
    private int pathIndex = 0;
    private float baseSpeed;
    private bool reachedFinalWaypoint = false;


    private void Start() {
        baseSpeed = moveSpeed;
        target = LevelManager.main.path[pathIndex];

    }

    private void Update() {

        if (reachedFinalWaypoint) {
            if (LevelManager.main.mainNode != null) {
                MoveTowardsTarget(LevelManager.main.mainNode.position);
            }
            return;
        }

        if (Vector2.Distance(target.position, transform.position) <= 0.1f) {
            pathIndex++;

            if (pathIndex >= LevelManager.main.path.Length) {
                // We've reached the final waypoint, now target the main node
                reachedFinalWaypoint = true;

                if (LevelManager.main.mainNode != null) {
                    Debug.Log("Enemy reached final waypoint, targeting main node");
                } else {
                    Debug.LogError("Main node not set in LevelManager!");
                    EnemySpawner.onEnemyDestroy.Invoke();
                    Destroy(gameObject);
                }
            } else {
                target = LevelManager.main.path[pathIndex];
            }
        }
    }

    private void FixedUpdate() {
        Vector2 direction = (target.position - transform.position).normalized;

        rb.velocity = direction * moveSpeed;
    }

    private void MoveTowardsTarget(Vector3 targetPosition) {
        Vector2 direction = (targetPosition - transform.position).normalized;
        rb.velocity = direction * moveSpeed;
    }

    public void UpdateSpeeed(float newSpeed) {
        moveSpeed = newSpeed;
    }

    public void ResetSpeed() {
        moveSpeed = baseSpeed;
    }
}
