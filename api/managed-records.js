import fetch from '../util/fetch-fill'
import URI from 'urijs'

// /records endpoint
window.path = 'http://localhost:3000/records'

//This function sets the options for the request, providing the offset and color params.
let setOptions = (uri, options) => {
    uri.setSearch({ limit: 11 })
    if (options) {
        if (!options.page || options.page === 1) {
            uri.setSearch({ offset: 0 })
        } else if (options.page > 1) {
            uri.setSearch({ offset: options.page * 10 - 10 })
        }
        if (options.colors !== undefined) {
            uri.setSearch({ 'color[]': options.colors })
        }
    }
}

// If the response is as desired, we pass the response on to the data parsing function. If not, an error is returned. 
const handleErrors = response => {
    return response.ok ? response.json() : new Error(response.statusText)
}

// This function creates the result object that will be returned, and sets the properties based on the requested details. 
//One important note: According to the instructions, the last page must be identified so that the nextPage property can be properly set to null
//in that case. As it stands, I saw the best option as fetching eleven objects, and then using the 11th object as a determinant of whether the page was the last. While this is perhaps not an optimal methodology for performing fetches, this does potentially open the discussion for ensuring accuracy and safety of data retrieval.

let parseResultData = (data, options) => {
    // Initialize results object to be return on success
    let results = {
        ids: [],
        open: [],
        closedPrimaryCount: 0,
        previousPage: null,
        nextPage: null
    }

    if (data.length > 10) {
        data.pop()
        results.nextPage = options.page + 1
    } else {
        results.nextPage = null
    }

    if (!options.page || options.page === 1) {
        results.previousPage = null
        data.length > 0 ? results.nextPage = 2 : results.nextPage = null
    } else {
        results.previousPage = options.page - 1
    }
    //forEach was mentioned as permissible in the public Slack channel, so it was used here. 
    data.forEach(object => {
        results.ids.push(object.id)
        if (object.disposition === 'open') {
            results.open.push({
                id: object.id,
                color: object.color,
                disposition: object.disposition,
                isPrimary: (object.color === 'red' || object.color === 'yellow' || object.color === 'blue') ? true : false
            })
        } else {
            if (object.color === 'red' || object.color === 'yellow' || object.color === 'blue') {
                results.closedPrimaryCount++
            }
        }
    })
    return results
}
// Fetches from the API and passes the result through a promise chain that handles errors if necessary and parses result data upon successful retrieval.
const fetchData = (uri, options) => {
    return fetch(uri)
        .then(res =>
            handleErrors(res)
        ).then(data =>
            parseResultData(data, options)
        )
        .catch(error => console.log('Oh no! The following error was encountered:  ' + error)
        )

}
// The central retrieval function, which creates the uri Obect and runs it through the options, and then calls the function that sets the data.
let retrieve = (options = {}) => {
    const uri = new URI(window.path)
    setOptions(uri, options)
    return fetchData(uri, options)
}

export default retrieve
