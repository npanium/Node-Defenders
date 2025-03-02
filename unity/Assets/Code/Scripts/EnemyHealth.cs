using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class EnemyHealth : MonoBehaviour {
    private Enemy enemyComponent;

    private void Awake() {
        // Get the Enemy component or add one if it doesn't exist
        enemyComponent = GetComponent<Enemy>();
        if (enemyComponent == null) {
            enemyComponent = gameObject.AddComponent<Enemy>();
        }
    }

    public void TakeDamage(int dmg) {
        // Forward to the Enemy component
        enemyComponent.TakeDamage(dmg);
    }
}
