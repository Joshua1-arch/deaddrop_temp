#[test_only]
module deaddrop::publication_tests {
    use sui::test_scenario::{Self, Scenario};
    use sui::clock::{Self, Clock};
    use deaddrop::publication::{Self, Publication};
    use std::string;

    // Test creator and viewer addresses
    const ALICE: address = 0xA;

    #[test]
    fun test_create_and_unlock_success() {
        let mut scenario_val = test_scenario::begin(ALICE);
        let scenario = &mut scenario_val;

        // 1. Create a Clock object and advance time
        test_scenario::next_tx(scenario, ALICE);
        let mut clock = clock::create_for_testing(test_scenario::ctx(scenario));
        clock::set_for_testing(&mut clock, 1000); // Set clock to 1000ms

        // 2. Create a publication with unlock time at 2000ms (locked)
        let blob_id = b"walrus-blob-id-123";
        let sha256_hash = b"sha256-hash-abc";
        let title = b"Classified Report";
        let category = b"leak";
        let unlock_at = 2000;

        publication::create_publication(
            blob_id,
            sha256_hash,
            title,
            category,
            unlock_at,
            &clock,
            test_scenario::ctx(scenario)
        );

        // 3. Verify publication was created and transferred to ALICE
        test_scenario::next_tx(scenario, ALICE);
        let mut pub_obj = test_scenario::take_from_sender<Publication>(scenario);

        assert!(publication::is_locked(&pub_obj) == true, 1);
        assert!(publication::get_unlock_at(&pub_obj) == 2000, 2);
        assert!(publication::get_created_at(&pub_obj) == 1000, 3);
        assert!(*publication::get_blob_id(&pub_obj) == string::utf8(blob_id), 4);
        assert!(*publication::get_sha256_hash(&pub_obj) == string::utf8(sha256_hash), 5);
        assert!(*publication::get_title(&pub_obj) == string::utf8(title), 6);
        assert!(*publication::get_category(&pub_obj) == string::utf8(category), 7);
        assert!(publication::get_owner(&pub_obj) == ALICE, 8);

        // 4. Advance clock past unlock time (e.g. 2500ms)
        clock::set_for_testing(&mut clock, 2500);

        // 5. Call try_unlock and check it unlocks
        publication::try_unlock(&mut pub_obj, &clock, test_scenario::ctx(scenario));
        assert!(publication::is_locked(&pub_obj) == false, 9);

        // 6. Return objects
        test_scenario::return_to_sender(scenario, pub_obj);
        clock::destroy_for_testing(clock);
        test_scenario::end(scenario_val);
    }

    #[test]
    #[expected_failure(abort_code = deaddrop::publication::EStillLocked)]
    fun test_unlock_too_early_fails() {
        let mut scenario_val = test_scenario::begin(ALICE);
        let scenario = &mut scenario_val;

        test_scenario::next_tx(scenario, ALICE);
        let mut clock = clock::create_for_testing(test_scenario::ctx(scenario));
        clock::set_for_testing(&mut clock, 1000);

        publication::create_publication(
            b"blob",
            b"hash",
            b"title",
            b"cat",
            2000, // unlock at 2000ms
            &clock,
            test_scenario::ctx(scenario)
        );

        test_scenario::next_tx(scenario, ALICE);
        let mut pub_obj = test_scenario::take_from_sender<Publication>(scenario);

        // Try to unlock at 1500ms (too early)
        clock::set_for_testing(&mut clock, 1500);
        publication::try_unlock(&mut pub_obj, &clock, test_scenario::ctx(scenario));

        test_scenario::return_to_sender(scenario, pub_obj);
        clock::destroy_for_testing(clock);
        test_scenario::end(scenario_val);
    }

    #[test]
    #[expected_failure(abort_code = deaddrop::publication::EAlreadyUnlocked)]
    fun test_unlock_already_unlocked_fails() {
        let mut scenario_val = test_scenario::begin(ALICE);
        let scenario = &mut scenario_val;

        test_scenario::next_tx(scenario, ALICE);
        let mut clock = clock::create_for_testing(test_scenario::ctx(scenario));
        clock::set_for_testing(&mut clock, 1000);

        // unlock_at is 500 (already passed at creation time of 1000)
        publication::create_publication(
            b"blob",
            b"hash",
            b"title",
            b"cat",
            500, 
            &clock,
            test_scenario::ctx(scenario)
        );

        test_scenario::next_tx(scenario, ALICE);
        let mut pub_obj = test_scenario::take_from_sender<Publication>(scenario);
        
        // Starts as unlocked
        assert!(publication::is_locked(&pub_obj) == false, 1);

        // Try to unlock (should abort since it is already unlocked)
        publication::try_unlock(&mut pub_obj, &clock, test_scenario::ctx(scenario));

        test_scenario::return_to_sender(scenario, pub_obj);
        clock::destroy_for_testing(clock);
        test_scenario::end(scenario_val);
    }
}
