import React from "react";
import xhrMock from "xhr-mock";
import {
  renderWithProviders,
  screen,
  waitForElementToBeRemoved,
} from "__support__/ui";
import {
  createMockCollection,
  createMockTable,
} from "metabase-types/api/mocks";
import SavedQuestionPicker from "./SavedQuestionPicker";

const CURRENT_USER = {
  id: 1,
  personal_collection_id: 222,
  is_superuser: true,
};

const COLLECTIONS = {
  PERSONAL: createMockCollection({
    id: CURRENT_USER.personal_collection_id,
    name: "My personal collection",
    personal_owner_id: CURRENT_USER.id,
  }),
  REGULAR: createMockCollection({ id: 1, name: "Regular collection" }),
};

function mockCollectionTreeEndpoint() {
  xhrMock.get("/api/collection/tree?tree=true", {
    body: Object.values(COLLECTIONS),
  });
}

function mockCollectionEndpoint() {
  xhrMock.get("/api/database/-1337/schema/Everything%20else", {
    body: [
      createMockTable({
        id: "card__1",
        display_name: "B",
        schema: "Everything else",
      }),
      createMockTable({
        id: "card__2",
        display_name: "a",
        schema: "Everything else",
      }),
      createMockTable({
        id: "card__3",
        display_name: "A",
        schema: "Everything else",
      }),
    ],
  });
}

async function setup() {
  mockCollectionTreeEndpoint();
  mockCollectionEndpoint();
  renderWithProviders(
    <SavedQuestionPicker onSelect={jest.fn()} onBack={jest.fn()} />,
  );
  await waitForElementToBeRemoved(() => screen.queryAllByText("Loading..."));
}

describe("SavedQuestionPicker", () => {
  beforeEach(() => {
    xhrMock.setup();
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
  });

  afterEach(() => {
    xhrMock.teardown();
  });

  it("shows the current user personal collection on the top after the root", async () => {
    await setup();

    expect(
      screen.getAllByTestId("tree-item-name").map(node => node.innerHTML),
    ).toEqual([
      "Our analytics",
      "Your personal collection",
      "Regular collection",
    ]);
  });

  it("sorts saved questions case-insensitive (metabase#23693)", async () => {
    await setup();

    expect(
      screen.getAllByTestId("option-text").map(node => node.innerHTML),
    ).toEqual(["a", "A", "B"]);
  });
});
