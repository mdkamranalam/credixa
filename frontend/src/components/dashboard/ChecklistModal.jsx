import React from "react";
import { X, CheckCircle } from "lucide-react";

const ChecklistModal = ({
  isOpen,
  onClose,
  checklistData,
  setChecklistData,
  onSave,
  isProcessing,
  actionError,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full h-[80vh] flex flex-col overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900 flex items-center">
            Configure Document Checklist
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto bg-gray-50">
          <p className="text-sm text-gray-500 mb-6 font-medium">
            Add, remove, or modify the required documents for student loan onboarding.
          </p>

          {actionError && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200">
              {actionError}
            </div>
          )}

          <div className="space-y-6">
            {Array.isArray(checklistData) &&
              checklistData.map((category, catIdx) => (
                <div
                  key={catIdx}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-5"
                >
                  <div className="mb-4 border-b border-gray-100 pb-3">
                    <h4 className="font-black text-lg text-gray-900">
                      {category.title}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {category.description}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {category.items.map((item, itemIdx) => (
                      <div
                        key={itemIdx}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 group transition-colors hover:bg-gray-100"
                      >
                        <div className="flex-1 mr-4">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => {
                              const newData = [...checklistData];
                              newData[catIdx].items[itemIdx].name = e.target.value;
                              setChecklistData(newData);
                            }}
                            className="w-full bg-transparent font-bold text-sm text-gray-900 focus:outline-none focus:ring-0 p-0 border-transparent focus:border-transparent"
                            placeholder="Document Name"
                          />
                          {item.note !== undefined && (
                            <input
                              type="text"
                              value={item.note}
                              onChange={(e) => {
                                const newData = [...checklistData];
                                newData[catIdx].items[itemIdx].note = e.target.value;
                                setChecklistData(newData);
                              }}
                              className="w-full text-xs text-gray-500 bg-transparent mt-1 focus:outline-none placeholder-gray-400"
                              placeholder="Optional Note (e.g. Mandatory for abroad studies)"
                            />
                          )}
                        </div>
                        <div className="flex items-center space-x-6">
                          <label className="flex items-center space-x-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={item.required}
                              onChange={(e) => {
                                const newData = [...checklistData];
                                newData[catIdx].items[itemIdx].required = e.target.checked;
                                setChecklistData(newData);
                              }}
                              className="rounded text-emerald-500 focus:ring-emerald-500 h-5 w-5 bg-white border-gray-300"
                            />
                            <span
                              className={`text-xs font-bold uppercase ${
                                item.required ? "text-emerald-600" : "text-gray-400"
                              }`}
                            >
                              Required
                            </span>
                          </label>
                          <button
                            onClick={() => {
                              const newData = [...checklistData];
                              newData[catIdx].items.splice(itemIdx, 1);
                              setChecklistData(newData);
                            }}
                            className="text-gray-300 hover:text-red-500 transition-colors p-1"
                            title="Remove Item"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      const newData = [...checklistData];
                      newData[catIdx].items.push({
                        name: "New Document",
                        required: false,
                        note: "",
                      });
                      setChecklistData(newData);
                    }}
                    className="mt-4 text-sm font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg transition-colors flex items-center"
                  >
                    + Add Document
                  </button>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={isProcessing}
            className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-500 hover:opacity-90 disabled:opacity-50 flex items-center"
          >
            {isProcessing ? (
              "Saving..."
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" /> Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChecklistModal;
