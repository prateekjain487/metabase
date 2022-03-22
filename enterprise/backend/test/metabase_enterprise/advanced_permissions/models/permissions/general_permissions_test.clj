(ns metabase-enterprise.advanced-permissions.models.permissions.general-permissions-test
  (:require [clojure.test :refer :all]
            [metabase-enterprise.advanced-permissions.models.permissions.general-permissions :as g-perms]
            [metabase.api.common :as api :refer [*current-user-id*]]
            [metabase.models :refer [GeneralPermissionsRevision PermissionsGroup]]
            [metabase.models.permissions :as perms]
            [metabase.models.permissions-group :as group]
            [metabase.test :as mt]
            [toucan.db :as db]))

(defn- clear-graph-revisions!
  []
  (db/delete! GeneralPermissionsRevision))

;; -------------------------------------------------- Fetch Graph ---------------------------------------------------

(deftest general-permissions-graph-test
  (mt/with-temp* [PermissionsGroup [{group-id :id}]]
    (testing "Should return general permission graph for all group-ids"
      (clear-graph-revisions!)
      (let [graph  (g-perms/graph)
            groups (:groups graph)]
        (is (= 0 (:revision graph)))
        (is (= (db/select-field :id PermissionsGroup) (set (keys groups))))
        (is (partial= {(:id (group/admin))
                       {:monitoring   :yes
                        :setting      :yes
                        :subscription :yes}
                       group-id
                       {:monitoring   :no
                        :setting      :no
                        :subscription :no}}
                      groups))))))

;;; ------------------------------------------------- Update Graph --------------------------------------------------

(defmacro with-new-group-and-current-graph
  "Create a new group-id and bind it with current-graph"
  [group-id-binding current-graph-binding & body]
  `(mt/with-temp* [PermissionsGroup [{group-id# :id}]]
     ;; currently all general permissions are disabled by default
     ;; so we manually enable subscriptions for now so we could test revoke
     ;; TODO: remove this once subscription are enabled by default
     (perms/grant-permissions! group-id# (g-perms/general-perms-path :subscription))
     ;; need to bind *current-user-id* or the Revision won't get updated
     (binding [*current-user-id* (mt/user->id :crowberto)]
       ((fn [~group-id-binding ~current-graph-binding] ~@body) group-id# (g-perms/graph)))))

(deftest general-permissions-update-graph!-test
  (testing "Grant successfully and increase revision"
    (with-new-group-and-current-graph group-id current-graph
      (let [new-graph     (assoc-in current-graph [:groups group-id :setting] :yes)
            _             (g-perms/update-graph! new-graph)
            updated-graph (g-perms/graph)]
        (is (= (:groups new-graph) (:groups updated-graph)))
        (is (= (inc (:revision current-graph)) (:revision updated-graph))))))

  (testing "Revoke successfully and increase revision"
    (with-new-group-and-current-graph group-id current-graph
      (let [new-graph     (assoc-in current-graph [:groups group-id :subscription] :no)
            _             (g-perms/update-graph! new-graph)
            updated-graph (g-perms/graph)]
        (is (= (:groups new-graph) (:groups updated-graph)))
        (is (= (inc (:revision current-graph)) (:revision updated-graph))))))

  (testing "We can do a no-op and revision won't changes"
    (with-new-group-and-current-graph group-id current-graph
      (g-perms/update-graph! current-graph)
      (let [updated-graph (g-perms/graph)]
        (is (= (:groups updated-graph) (:groups updated-graph)))
        (is (= (:revision current-graph) (:revision updated-graph))))))

  (testing "Failed when try to update permission for admin group"
    (with-new-group-and-current-graph group-id current-graph
      (let [new-graph (assoc-in current-graph [:groups (:id (group/admin)) :subscription] :no)]
        (is (thrown-with-msg?
             clojure.lang.ExceptionInfo
             #"You cannot create or revoke permissions for the 'Admin' group."
             (g-perms/update-graph! new-graph))))))

  (testing "Failed when revision is mismatched"
    (with-new-group-and-current-graph group-id current-graph
      (let [new-graph (assoc current-graph :revision (inc (:revision current-graph)))]
        (is (thrown-with-msg?
             clojure.lang.ExceptionInfo
             #"Looks like someone else edited the permissions and your data is out of date. Please fetch new data and try again."
             (g-perms/update-graph! new-graph))))))

  (testing "Ignore permissions that are not in current graph"
    (with-new-group-and-current-graph group-id current-graph
      (let [new-graph     (assoc-in current-graph [:groups group-id :random-setting] :yes)
            _             (g-perms/update-graph! new-graph)
            updated-graph (g-perms/graph)]
        (is (= (:groups current-graph) (:groups updated-graph)))
        (is (= (:revision current-graph) (:revision updated-graph))))))

  (testing "Ignore group-ids that are not in current graph"
    (with-new-group-and-current-graph group-id current-graph
      (let [non-existing-group-id (inc group-id)
            new-graph             (update current-graph :groups
                                          assoc non-existing-group-id {:setting      :yes
                                                                       :monitoring   :no
                                                                       :subscription :yes})
            _                     (g-perms/update-graph! new-graph)
            updated-graph         (g-perms/graph)]
        (is (= (:groups current-graph) (:groups updated-graph)))
        (is (= (:revision current-graph) (:revision updated-graph)))))))