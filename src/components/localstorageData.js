const keys = {
    is_edit_activity: "is_edit_activity",
}

exports.setEditActivityStatus = (value) =>{
    localStorage.setItem(keys.is_edit_activity, value);
}

exports.getEditActivityStatus = () =>{
    const valueEdit = localStorage.getItem(keys.is_edit_activity);
    return valueEdit == null || valueEdit === undefined ? false : String(valueEdit).toLowerCase() === "true";
}
